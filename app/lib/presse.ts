/**
 * Collecte et recoupement de la presse publique.
 *
 * Le flux RSS de Google Actualités est public, gratuit et sans clé. Il ne donne
 * que des titres et des liens : tout ce qui suit travaille donc sur des titres
 * d'articles déjà publiés, jamais sur du contenu privé.
 *
 * L'apport de ce module par rapport à une simple recherche, c'est le recoupement :
 * on interroge plusieurs angles, on fusionne, puis on mesure en clair combien de
 * médias distincts rapportent la même chose. Un fait repris par six rédactions
 * n'a pas le même statut qu'un fait rapporté par une seule — et c'est calculé
 * ici, dans le code, pas laissé à l'appréciation du modèle.
 */

import { formaterDateRss, jourEnFrancais, jourIso } from "./dates";

const UA = "StudioContenuIA/1.0 (revue de presse; contact via depot GitHub)";

export type Article = {
  titre: string;
  source: string;
  date: string | null;
  /** Jour ISO (« 2026-07-27 ») : sert au tri et au regroupement. */
  jour: string | null;
  url: string;
  /** Angle de recherche qui a fait remonter l'article. */
  angle: string;
};

/* ------------------------------------------------------------------ */
/* Lecture du flux                                                     */
/* ------------------------------------------------------------------ */

const ENTITES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function decoder(texte: string): string {
  let sortie = texte.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");

  // Google échappe parfois deux fois (« &amp;#39; ») : on repasse jusqu'à stabilité.
  for (let passe = 0; passe < 3; passe++) {
    const avant = sortie;
    sortie = sortie
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
      .replace(/&[a-z]+;/gi, (e) => ENTITES[e.toLowerCase()] ?? e);
    if (sortie === avant) break;
  }

  return sortie.trim();
}

function extraire(bloc: string, balise: string): string | null {
  const m = new RegExp(`<${balise}[^>]*>([\\s\\S]*?)</${balise}>`).exec(bloc);
  return m ? decoder(m[1]) : null;
}

type Marche = { hl: string; gl: string; ceid: string };

const FR: Marche = { hl: "fr", gl: "FR", ceid: "FR:fr" };
const EN: Marche = { hl: "en-US", gl: "US", ceid: "US:en" };

async function interroger(
  requete: string,
  marche: Marche,
  angle: string,
  limite: number,
): Promise<Article[]> {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", requete);
  url.searchParams.set("hl", marche.hl);
  url.searchParams.set("gl", marche.gl);
  url.searchParams.set("ceid", marche.ceid);

  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`Google Actualités a répondu ${res.status}`);

  const xml = await res.text();
  const blocs = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return blocs.slice(0, limite).map((bloc) => {
    const titreBrut = extraire(bloc, "title") ?? "";
    const source = extraire(bloc, "source") ?? "Source inconnue";
    // Google suffixe le titre par « - Nom du média » : on l'enlève, il fait doublon.
    const titre = titreBrut.replace(new RegExp(`\\s+-\\s+${source}$`), "");
    const pubDate = extraire(bloc, "pubDate");

    return {
      titre,
      source,
      date: formaterDateRss(pubDate),
      jour: jourIso(pubDate),
      url: extraire(bloc, "link") ?? "",
      angle,
    };
  });
}

/** Recherche simple, un seul angle — utilisée par la page Intel. */
export async function chercherActualite(nom: string, limite = 14): Promise<Article[]> {
  return interroger(nom, FR, "presse française", limite);
}

/* ------------------------------------------------------------------ */
/* Normalisation et vocabulaire                                        */
/* ------------------------------------------------------------------ */

export function sansAccents(texte: string): string {
  return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normaliser(texte: string): string {
  return sansAccents(texte.toLowerCase()).replace(/[^a-z0-9\s]/g, " ");
}

// Mots trop fréquents pour porter du sens dans un titre de presse.
const VIDES = new Set(
  `alors apres aucun aussi autre avant avec avoir bien cela cette chez comme
   dans depuis deux dont elle elles encore entre etait etre eux fait faire
   font hier ils leur leurs mais meme moins nous parce pareil pas peut plus
   pour pourquoi quand que quel quelle qui quoi sans selon ses soit sont sous
   sur tous tout toute toutes tres trop une vers voici voila vont vous
   about after again against all also among another any are been before
   being between both but can could did does down during each even ever
   every for from had has have her here him his how into its just like
   made make many may more most much must new not now off one only other
   our out over said same she should since some such than that the their
   them then there these they this those through too under until upon very
   was way were what when where which while who why will with would you your
   news video photos live update updates report reports`
    .split(/\s+/)
    .filter(Boolean),
);

/** Mots significatifs d'un titre, hors vocabulaire du sujet lui-même. */
function motsCles(titre: string, exclus: Set<string>): string[] {
  return [
    ...new Set(
      normaliser(titre)
        .split(/\s+/)
        .filter((m) => m.length >= 4 && !VIDES.has(m) && !exclus.has(m)),
    ),
  ];
}

/** Empreinte d'un titre, pour repérer deux reprises du même article. */
function empreinte(titre: string): string {
  return normaliser(titre).split(/\s+/).filter(Boolean).sort().join(" ");
}

/* ------------------------------------------------------------------ */
/* Collecte multi-angles                                               */
/* ------------------------------------------------------------------ */

/**
 * Interroge plusieurs angles en parallèle puis fusionne.
 *
 * Un seul angle passe à côté de beaucoup : la presse francophone et la presse
 * anglophone ne couvrent pas les mêmes aspects d'un même sujet, et la recherche
 * en phrase exacte écarte les homonymes que la recherche large fait remonter.
 */
export async function collecterCorpus(
  nom: string,
  focus?: string,
): Promise<{ articles: Article[]; angles: string[] }> {
  const requetes: { requete: string; marche: Marche; angle: string; limite: number }[] = [
    { requete: nom, marche: FR, angle: "presse française", limite: 20 },
    { requete: `"${nom}"`, marche: FR, angle: "mention exacte", limite: 20 },
    { requete: nom, marche: EN, angle: "presse internationale", limite: 20 },
  ];

  if (focus?.trim()) {
    requetes.push({
      requete: `${nom} ${focus.trim()}`,
      marche: FR,
      angle: `angle « ${focus.trim()} »`,
      limite: 20,
    });
  }

  const reponses = await Promise.allSettled(
    requetes.map((r) => interroger(r.requete, r.marche, r.angle, r.limite)),
  );

  // Un angle en échec ne doit pas faire tomber le dossier entier.
  const echecs = reponses.filter((r) => r.status === "rejected");
  if (echecs.length === reponses.length) {
    throw new Error(
      (echecs[0] as PromiseRejectedResult).reason?.message ??
        "Google Actualités est injoignable pour le moment.",
    );
  }

  const vus = new Map<string, Article>();
  const anglesUtiles = new Set<string>();

  for (const reponse of reponses) {
    if (reponse.status !== "fulfilled") continue;
    for (const article of reponse.value) {
      if (!article.titre || !article.url) continue;
      const cle = empreinte(article.titre);
      if (vus.has(cle)) continue;
      vus.set(cle, article);
      anglesUtiles.add(article.angle);
    }
  }

  const articles = [...vus.values()].sort((a, b) => {
    if (a.jour && b.jour) return b.jour.localeCompare(a.jour);
    if (a.jour) return -1;
    if (b.jour) return 1;
    return 0;
  });

  return { articles, angles: [...anglesUtiles] };
}

/* ------------------------------------------------------------------ */
/* Recoupement                                                         */
/* ------------------------------------------------------------------ */

export type Niveau = "Convergent" | "Rapporté" | "Source unique";

export type Theme = {
  /** Mots-clés qui définissent le regroupement. */
  mots: string[];
  articles: Article[];
  /** Médias distincts ayant traité le thème. */
  sources: string[];
  niveau: Niveau;
};

function niveauDe(nbSources: number): Niveau {
  if (nbSources >= 3) return "Convergent";
  if (nbSources === 2) return "Rapporté";
  return "Source unique";
}

/**
 * Regroupe les articles par sujet, en se basant sur les mots-clés partagés
 * entre les titres, puis compte les médias distincts de chaque groupe.
 *
 * C'est volontairement un regroupement lexical simple, pas une compréhension
 * du texte : il rapproche des titres qui parlent visiblement de la même chose.
 * Le nombre de médias distincts qui en sort est, lui, un fait vérifiable.
 */
export function regrouperThemes(articles: Article[], sujet: string): Theme[] {
  // Les mots du sujet sont dans tous les titres : ils ne discriminent rien.
  const exclus = new Set(
    normaliser(sujet).split(/\s+/).filter((m) => m.length >= 3),
  );

  type Groupe = { mots: Set<string>; articles: Article[] };
  const groupes: Groupe[] = [];

  for (const article of articles) {
    const mots = motsCles(article.titre, exclus);
    if (mots.length === 0) continue;

    // Deux mots-clés communs suffisent à rapprocher deux titres. Mais un titre
    // court porte peu de mots : « Des subventions publiques en question » et
    // « Polémique sur les subventions, le groupe dément » ne partagent que
    // « subventions » et parlent pourtant du même sujet. On accepte donc aussi
    // un seul mot commun quand il pèse au moins un tiers du titre.
    const existant = groupes.find((g) => {
      const communs = mots.filter((m) => g.mots.has(m)).length;
      if (communs >= 2) return true;
      return communs >= 1 && communs / Math.min(mots.length, g.mots.size) >= 1 / 3;
    });

    if (existant) {
      existant.articles.push(article);
      for (const m of mots) existant.mots.add(m);
    } else {
      groupes.push({ mots: new Set(mots), articles: [article] });
    }
  }

  return groupes
    .map((g) => {
      const sources = [...new Set(g.articles.map((a) => a.source))];
      // On garde les mots les plus partagés au sein du groupe : ils le résument.
      const frequence = new Map<string, number>();
      for (const article of g.articles) {
        for (const m of motsCles(article.titre, exclus)) {
          frequence.set(m, (frequence.get(m) ?? 0) + 1);
        }
      }
      const mots = [...frequence.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(([m]) => m);

      return { mots, articles: g.articles, sources, niveau: niveauDe(sources.length) };
    })
    .sort(
      (a, b) => b.sources.length - a.sources.length || b.articles.length - a.articles.length,
    );
}

/* ------------------------------------------------------------------ */
/* Chronologie                                                         */
/* ------------------------------------------------------------------ */

export type Jour = { jour: string; libelle: string; articles: Article[] };

export function construireChronologie(articles: Article[]): Jour[] {
  const parJour = new Map<string, Article[]>();

  for (const article of articles) {
    if (!article.jour) continue;
    const liste = parJour.get(article.jour) ?? [];
    liste.push(article);
    parJour.set(article.jour, liste);
  }

  return [...parJour.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([jour, liste]) => ({ jour, libelle: jourEnFrancais(jour), articles: liste }));
}

/* ------------------------------------------------------------------ */
/* Signaux à vérifier                                                  */
/* ------------------------------------------------------------------ */

// Un titre qui dément, nie ou relativise : signe que le sujet est disputé.
const DEMENTIS =
  /\b(dement|dementi|dementie|nie|nient|refute|refutee|faux|fausse|rumeur|infonde|infondee|conteste|contestee|denies|denied|denial|refutes|rejects|false|hoax|unfounded)\b/;

export type Signal = {
  type: "contradiction" | "source-unique" | "sans-date";
  message: string;
  articles: Article[];
};

/**
 * Signale ce qui mérite une vérification humaine. Ce sont des alertes de
 * lecture, jamais des conclusions : un démenti dans un titre indique que la
 * question est disputée, pas qui a raison.
 */
export function detecterSignaux(themes: Theme[], articles: Article[]): Signal[] {
  const signaux: Signal[] = [];

  for (const theme of themes) {
    const dementis = theme.articles.filter((a) => DEMENTIS.test(normaliser(a.titre)));
    if (dementis.length > 0 && dementis.length < theme.articles.length) {
      signaux.push({
        type: "contradiction",
        message: `Sur « ${theme.mots.slice(0, 3).join(", ")} », ${dementis.length} article(s) démentent ou relativisent ce que d'autres affirment. Les deux versions coexistent dans la presse : à trancher à la source.`,
        articles: theme.articles,
      });
    }
  }

  const isoles = themes.filter((t) => t.niveau === "Source unique" && t.articles.length >= 2);
  if (isoles.length > 0) {
    signaux.push({
      type: "source-unique",
      message: `${isoles.length} sujet(s) ne reposent que sur un seul média. Rien ne les contredit, mais rien ne les confirme non plus.`,
      articles: isoles.flatMap((t) => t.articles),
    });
  }

  const sansDate = articles.filter((a) => !a.jour);
  if (sansDate.length > 0) {
    signaux.push({
      type: "sans-date",
      message: `${sansDate.length} article(s) arrivent sans date exploitable et n'apparaissent pas dans la chronologie.`,
      articles: sansDate,
    });
  }

  return signaux;
}
