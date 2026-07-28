import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Intel : analyse l'actualité d'une personnalité selon deux grilles de lecture,
 * inspirées du travail des journalistes de mercato et d'investigation.
 *
 * Les faits viennent uniquement d'articles réels récupérés via Google Actualités.
 * L'IA ne fait que lire, trier et questionner ces articles : elle n'invente rien
 * et ne signe jamais au nom d'un journaliste existant.
 */

const UA = "StudioContenuIA/1.0 (revue de presse; contact via depot GitHub)";

type Article = {
  titre: string;
  source: string;
  date: string | null;
  url: string;
};

const ENTITES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decoder(texte: string): string {
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

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** « Mon, 27 Jul 2026 18:04:00 GMT » → « 27 juillet 2026 ». */
function formaterDate(brute: string | null): string | null {
  if (!brute) return null;
  const d = new Date(brute);
  if (Number.isNaN(d.getTime())) return brute;
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Google Actualités : flux RSS public, gratuit et sans clé. */
async function chercherActualite(nom: string): Promise<Article[]> {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", nom);
  url.searchParams.set("hl", "fr");
  url.searchParams.set("gl", "FR");
  url.searchParams.set("ceid", "FR:fr");

  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`Google Actualités a répondu ${res.status}`);

  const xml = await res.text();
  const blocs = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return blocs.slice(0, 14).map((bloc) => {
    const titreBrut = extraire(bloc, "title") ?? "";
    const source = extraire(bloc, "source") ?? "Source inconnue";
    // Google suffixe le titre par « - Nom du média » : on l'enlève, il fait doublon.
    const titre = titreBrut.replace(new RegExp(`\\s+-\\s+${source}$`), "");

    return {
      titre,
      source,
      date: formaterDate(extraire(bloc, "pubDate")),
      url: extraire(bloc, "link") ?? "",
    };
  });
}

/* ------------------------------------------------------------------ */
/* Grilles de lecture                                                  */
/* ------------------------------------------------------------------ */

const CADRE = `Tu analyses une revue de presse pour un utilisateur francophone.

Règles absolues :
- Tu ne t'appuies QUE sur les articles fournis. Tu n'ajoutes aucun fait venu d'ailleurs.
- Si les articles ne disent rien sur un point, tu écris « non renseigné dans ces sources » au lieu d'inventer.
- Tu distingues toujours ce qui est affirmé par un média de ce qui reste une hypothèse, et tu cites le média entre parenthèses.
- Tu n'accuses personne. Tu peux relever une zone d'ombre ou une question sans réponse, jamais présenter un soupçon comme un fait établi.
- Tu n'écris jamais au nom d'un journaliste réel et tu ne signes pas ton analyse.
- Tu réponds en français, en Markdown, sans préambule.`;

const GRILLES: Record<string, { titre: string; consigne: string }> = {
  mercato: {
    titre: "Grille mercato",
    consigne: `Analyse le dossier comme un suiveur de marché des transferts, avec ces sections :

## L'état du dossier
Où en est-on aujourd'hui, en 3 phrases maximum.

## Qui pousse, qui freine
Les parties en présence (joueur, clubs, entourage, dirigeants) et ce que chacune cherche, d'après les sources.

## Confirmé / rapporté / spéculatif
Trois listes courtes. « Confirmé » = annoncé officiellement ou par plusieurs médias concordants. « Rapporté » = un seul média. « Spéculatif » = conditionnel, « selon nos informations », rumeur.

## Solidité de l'info
Un niveau parmi : **Officiel**, **Convergent**, **Piste sérieuse**, **Rumeur isolée**. Justifie en une phrase par la concordance des sources et leur qualité.

## Ce qui décidera de la suite
Les 2 ou 3 éléments concrets à surveiller (échéance, montant, décision attendue).`,
  },
  enquete: {
    titre: "Grille investigation",
    consigne: `Analyse le sujet comme un journaliste d'investigation prépare un dossier, avec ces sections :

## Ce que disent les sources
Les faits rapportés, sans interprétation, avec le média entre parenthèses.

## Qui décide, qui paie
Les acteurs, les institutions et les flux d'argent mentionnés. Écris « non renseigné » pour ce qui manque.

## Zones d'ombre
Les points que les articles laissent sans réponse. Formule-les comme des manques d'information, jamais comme des accusations.

## Les questions à poser
5 questions précises qu'un journaliste poserait, chacune adressée à quelqu'un d'identifié (« au président de X : … »).

## Ce qu'il faudrait vérifier
Documents, registres publics ou recoupements qui permettraient de trancher (comptes publiés, dépôts officiels, contrats, autres témoignages).

## Prudence
Une phrase rappelant ce que ces sources ne permettent PAS de conclure.`,
  },
};

function construirePrompt(nom: string, grille: string, articles: Article[]): string {
  const { consigne } = GRILLES[grille];
  const revue = articles
    .map(
      (a, i) =>
        `${i + 1}. « ${a.titre} » — ${a.source}${a.date ? ` (${a.date})` : ""}`,
    )
    .join("\n");

  return `Sujet : ${nom}

Revue de presse (titres réels, les plus récents d'abord) :
${revue}

${consigne}`;
}

/* ------------------------------------------------------------------ */
/* Moteurs                                                             */
/* ------------------------------------------------------------------ */

// Mode gratuit : Pollinations.ai, sans clé API.
async function analyserGratuit(prompt: string): Promise<string> {
  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: [
        { role: "system", content: CADRE },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(
      "Le service d'analyse gratuit est saturé. Réessayez dans quelques instants.",
    );
  }

  const data = await res.json();
  const texte: string = data?.choices?.[0]?.message?.content ?? "";
  if (!texte.trim()) throw new Error("Le service gratuit a renvoyé une réponse vide.");
  return texte;
}

// Mode premium : Claude, si une clé Anthropic est configurée.
async function analyserClaude(prompt: string): Promise<string> {
  const client = new Anthropic();

  const reponse = await client.beta.messages.create({
    model: "claude-opus-5",
    max_tokens: 8000,
    // Si les filtres déclinent la demande, le relais bascule sur un autre modèle.
    betas: ["server-side-fallback-2026-06-01"],
    fallbacks: [{ model: "claude-opus-4-8" }],
    output_config: { effort: "high" },
    system: [{ type: "text", text: CADRE, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: prompt }],
  });

  if (reponse.stop_reason === "refusal") {
    throw new Error(
      "L'analyse a été refusée par les filtres de sécurité du modèle pour ce sujet.",
    );
  }

  return reponse.content
    .filter((bloc) => bloc.type === "text")
    .map((bloc) => (bloc as { text: string }).text)
    .join("\n")
    .trim();
}

/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  let nom: unknown;
  let grille: unknown;

  try {
    ({ nom, grille } = await req.json());
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  if (typeof nom !== "string" || !nom.trim()) {
    return Response.json({ error: "Indiquez un nom à analyser." }, { status: 400 });
  }

  const cle = typeof grille === "string" && grille in GRILLES ? grille : "mercato";

  try {
    const articles = await chercherActualite(nom.trim());

    if (articles.length === 0) {
      return Response.json(
        {
          error: `Aucun article récent trouvé sur « ${nom} ». Essayez une orthographe différente ou un nom plus connu.`,
        },
        { status: 404 },
      );
    }

    const prompt = construirePrompt(nom.trim(), cle, articles);
    const analyse = process.env.ANTHROPIC_API_KEY
      ? await analyserClaude(prompt)
      : await analyserGratuit(prompt);

    return Response.json({
      articles,
      analyse,
      grille: cle,
      moteur: process.env.ANTHROPIC_API_KEY ? "Claude" : "gratuit",
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "L'analyse a échoué." },
      { status: 502 },
    );
  }
}
