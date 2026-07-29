/**
 * Accès à Wikipédia et Wikidata : recherche, fiche détaillée et faits structurés.
 *
 * Ces deux sources sont encyclopédiques et publiques : elles ne documentent que
 * des personnes et organisations notoires, et uniquement ce qui a déjà été publié
 * par ailleurs. Aucune clé API n'est nécessaire.
 */

import { calculerAge, formaterDateWikidata } from "./dates";

// Wikimedia exige un User-Agent identifiable sur ses APIs.
const UA = "StudioContenuIA/1.0 (fiches personnalites; contact via depot GitHub)";

export const LANGS = ["fr", "en"] as const;
export type Lang = (typeof LANGS)[number];

export function normaliseLang(value: string | null): Lang {
  return value === "en" ? "en" : "fr";
}

export async function wiki(lang: Lang, params: Record<string, string>) {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Wikipédia a répondu ${res.status}`);
  return res.json();
}

export async function wikidata(params: Record<string, string>) {
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Wikidata a répondu ${res.status}`);
  return res.json();
}

/* ------------------------------------------------------------------ */
/* Recherche                                                           */
/* ------------------------------------------------------------------ */

export type Resultat = {
  titre: string;
  description: string | null;
  extrait: string | null;
  image: string | null;
  lang: Lang;
};

function pagesVersResultats(data: any, lang: Lang): Resultat[] {
  const pages: any[] = data?.query?.pages ?? [];
  return pages
    .slice()
    .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
    .map((p) => ({
      titre: p.title as string,
      description: p.description ?? null,
      extrait: typeof p.extract === "string" ? p.extract.trim() || null : null,
      image: p.thumbnail?.source ?? null,
      lang,
    }));
}

export async function rechercher(q: string, lang: Lang): Promise<Resultat[]> {
  const params = {
    generator: "search",
    gsrsearch: q,
    gsrlimit: "8",
    prop: "pageimages|description|extracts",
    piprop: "thumbnail",
    pithumbsize: "220",
    exintro: "1",
    explaintext: "1",
    exsentences: "2",
  };

  const resultats = pagesVersResultats(await wiki(lang, params), lang);
  if (resultats.length > 0) return resultats;

  // Rien dans cette langue : on retente dans l'autre version de Wikipédia.
  const secours: Lang = lang === "fr" ? "en" : "fr";
  return pagesVersResultats(await wiki(secours, params), secours);
}

/* ------------------------------------------------------------------ */
/* Fiche détaillée                                                     */
/* ------------------------------------------------------------------ */

// Propriétés Wikidata retenues : parcours public et professionnel.
const FAITS: { prop: string; label: string }[] = [
  { prop: "P569", label: "Naissance" },
  { prop: "P19", label: "Lieu de naissance" },
  { prop: "P570", label: "Décès" },
  { prop: "P20", label: "Lieu de décès" },
  { prop: "P27", label: "Nationalité" },
  { prop: "P106", label: "Profession" },
  { prop: "P39", label: "Fonction" },
  { prop: "P108", label: "Employeur" },
  { prop: "P69", label: "Formation" },
  { prop: "P1412", label: "Langues" },
  { prop: "P54", label: "Clubs" },
  { prop: "P413", label: "Poste" },
  // Organisations : utile quand le sujet du dossier est une entreprise.
  { prop: "P159", label: "Siège" },
  { prop: "P571", label: "Création" },
  { prop: "P169", label: "Direction" },
  { prop: "P452", label: "Secteur" },
  { prop: "P749", label: "Maison mère" },
];

const LISTES: { prop: string; label: string }[] = [
  { prop: "P800", label: "Œuvres notables" },
  { prop: "P166", label: "Distinctions" },
  { prop: "P1411", label: "Nominations" },
  { prop: "P355", label: "Filiales" },
];

const LIENS: { prop: string; label: string; modele: (v: string) => string }[] = [
  { prop: "P856", label: "Site officiel", modele: (v) => v },
  { prop: "P2002", label: "X (Twitter)", modele: (v) => `https://x.com/${v}` },
  { prop: "P2003", label: "Instagram", modele: (v) => `https://instagram.com/${v}` },
  { prop: "P2013", label: "Facebook", modele: (v) => `https://facebook.com/${v}` },
  { prop: "P2397", label: "YouTube", modele: (v) => `https://youtube.com/channel/${v}` },
  { prop: "P6634", label: "LinkedIn", modele: (v) => `https://linkedin.com/in/${v}` },
  { prop: "P345", label: "IMDb", modele: (v) => `https://www.imdb.com/name/${v}/` },
];

/** Ne garde que les valeurs affirmées (ni dépréciées, ni vides). */
function claimsValides(entite: any, prop: string): any[] {
  const list: any[] = entite?.claims?.[prop] ?? [];
  return list.filter(
    (c) => c?.rank !== "deprecated" && c?.mainsnak?.snaktype === "value",
  );
}

function valeurs(entite: any, prop: string): any[] {
  return claimsValides(entite, prop).map((c) => c.mainsnak.datavalue?.value);
}

/** Récupère les libellés FR/EN des entités référencées (par lots de 50). */
async function chargerLibelles(ids: string[]): Promise<Record<string, string>> {
  const uniques = [...new Set(ids)].filter(Boolean);
  const libelles: Record<string, string> = {};

  for (let i = 0; i < uniques.length; i += 50) {
    const lot = uniques.slice(i, i + 50);
    const data = await wikidata({
      action: "wbgetentities",
      ids: lot.join("|"),
      props: "labels",
      languages: "fr|en",
    });
    for (const [id, ent] of Object.entries<any>(data?.entities ?? {})) {
      const label = ent?.labels?.fr?.value ?? ent?.labels?.en?.value;
      if (label) libelles[id] = label;
    }
  }
  return libelles;
}

async function chargerSimilaires(titre: string, lang: Lang): Promise<Resultat[]> {
  try {
    const data = await wiki(lang, {
      generator: "search",
      gsrsearch: `morelike:${titre}`,
      gsrlimit: "6",
      prop: "pageimages|description",
      piprop: "thumbnail",
      pithumbsize: "160",
    });
    return pagesVersResultats(data, lang).filter((r) => r.titre !== titre);
  } catch {
    return []; // Les suggestions sont un bonus : jamais bloquantes.
  }
}

export type Fiche = {
  titre: string;
  lang: Lang;
  description: string | null;
  biographie: string;
  image: string | null;
  urlWikipedia: string | null;
  urlWikidata: string | null;
  estPersonne: boolean;
  age: number | null;
  faits: { label: string; valeurs: string[] }[];
  listes: { label: string; valeurs: string[] }[];
  liens: { label: string; url: string }[];
  similaires: Resultat[];
};

export async function construireFiche(
  titre: string,
  lang: Lang,
  options: { similaires?: boolean } = {},
): Promise<Fiche | null> {
  const data = await wiki(lang, {
    action: "query",
    titles: titre,
    redirects: "1",
    prop: "extracts|pageimages|pageprops|info",
    inprop: "url",
    exintro: "1",
    explaintext: "1",
    piprop: "original|thumbnail",
    pithumbsize: "480",
  });

  const page = data?.query?.pages?.[0];
  if (!page || page.missing) return null;

  const qid: string | undefined = page.pageprops?.wikibase_item;

  const fiche: Fiche = {
    titre: page.title,
    lang,
    description: page.description ?? null,
    biographie: typeof page.extract === "string" ? page.extract.trim() : "",
    image: page.original?.source ?? page.thumbnail?.source ?? null,
    urlWikipedia: page.fullurl ?? null,
    urlWikidata: qid ? `https://www.wikidata.org/wiki/${qid}` : null,
    estPersonne: false,
    age: null,
    faits: [],
    listes: [],
    liens: [],
    similaires: [],
  };

  // Le dossier n'a pas besoin des suggestions : on évite l'appel réseau.
  const similairesPromise = options.similaires === false
    ? Promise.resolve([] as Resultat[])
    : chargerSimilaires(page.title, lang);

  if (qid) {
    const entiteData = await wikidata({
      action: "wbgetentities",
      ids: qid,
      props: "claims|descriptions",
      languages: "fr|en",
    });
    const entite = entiteData?.entities?.[qid];

    if (entite) {
      fiche.estPersonne = valeurs(entite, "P31").some((v: any) => v?.id === "Q5");
      fiche.description =
        fiche.description ??
        entite.descriptions?.fr?.value ??
        entite.descriptions?.en?.value ??
        null;

      // Un seul aller-retour pour tous les libellés référencés.
      const idsAResoudre: string[] = [];
      for (const { prop } of [...FAITS, ...LISTES]) {
        for (const v of valeurs(entite, prop)) {
          if (v?.id) idsAResoudre.push(v.id);
        }
      }
      const libelles = await chargerLibelles(idsAResoudre);

      const rendre = (v: any): string | null => {
        if (v == null) return null;
        if (typeof v === "string") return v;
        if (v.id) return libelles[v.id] ?? null;
        if (v.time) return formaterDateWikidata(v);
        if (v.text) return v.text;
        return null;
      };

      for (const { prop, label } of FAITS) {
        const vals = valeurs(entite, prop).map(rendre).filter(Boolean) as string[];
        if (vals.length) fiche.faits.push({ label, valeurs: [...new Set(vals)].slice(0, 6) });
      }

      for (const { prop, label } of LISTES) {
        const vals = valeurs(entite, prop).map(rendre).filter(Boolean) as string[];
        if (vals.length) fiche.listes.push({ label, valeurs: [...new Set(vals)].slice(0, 12) });
      }

      for (const { prop, label, modele } of LIENS) {
        const v = valeurs(entite, prop)[0];
        if (typeof v === "string" && v.trim()) fiche.liens.push({ label, url: modele(v.trim()) });
      }

      fiche.age = calculerAge(valeurs(entite, "P569")[0], valeurs(entite, "P570")[0]);
    }
  }

  fiche.similaires = await similairesPromise;
  return fiche;
}

/**
 * Résout un nom libre vers la fiche encyclopédique la plus probable.
 * Renvoie null si le nom ne correspond à aucune page : c'est le cas normal
 * pour une personne non publique, et le dossier le signale explicitement.
 */
export async function resoudreIdentite(nom: string, lang: Lang = "fr"): Promise<Fiche | null> {
  const directe = await construireFiche(nom, lang, { similaires: false });
  if (directe) return directe;

  const resultats = await rechercher(nom, lang);
  if (resultats.length === 0) return null;

  const meilleur = resultats[0];
  return construireFiche(meilleur.titre, meilleur.lang, { similaires: false });
}
