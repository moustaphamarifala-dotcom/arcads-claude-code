import Anthropic from "@anthropic-ai/sdk";
import { type Fiche, resoudreIdentite } from "@/app/lib/encyclopedie";
import {
  type Article,
  type Jour,
  type Signal,
  type Theme,
  collecterCorpus,
  construireChronologie,
  detecterSignaux,
  regrouperThemes,
} from "@/app/lib/presse";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Dossier : tout ce qui est déjà public sur un sujet, rassemblé et recoupé.
 *
 * Le principe : une information dispersée dans quarante articles et une fiche
 * encyclopédique est publique, mais personne ne va la lire à la main. La valeur
 * de cet outil est là — rassembler et surtout *hiérarchiser* : ce que plusieurs
 * rédactions confirment, ce qui ne tient qu'à une seule, et ce qui se contredit.
 *
 * Ce qu'il ne fait pas, par construction : il n'a aucune source non publique.
 * Pas de fuite de données, pas de registre privé, pas de réseau social aspiré.
 * S'il ne trouve rien, c'est qu'il n'y a rien de public — et il le dit, au lieu
 * de combler le vide.
 */

/** En dessous de ce seuil, le sujet n'a pas d'existence publique documentée. */
const SEUIL_PUBLIC = 3;

/* ------------------------------------------------------------------ */
/* Cadrage du modèle                                                   */
/* ------------------------------------------------------------------ */

const CADRE = `Tu rédiges la synthèse d'un dossier documentaire pour un lecteur francophone.

Tout ton matériau t'est fourni dans le message : une fiche encyclopédique et des
titres de presse réels, déjà regroupés par sujet, avec le nombre de médias
distincts qui traitent chacun.

Règles absolues :
- Tu n'utilises QUE le matériau fourni. Tu n'ajoutes aucun fait venu d'ailleurs,
  même si tu crois le connaître.
- Le nombre de médias distincts t'est donné : il fixe le statut de chaque
  information. Trois médias ou plus = solidement rapporté. Deux = rapporté.
  Un seul = fragile, et tu l'écris.
- Un titre de presse n'est pas un fait vérifié : tu écris « selon X » et jamais
  « il est établi que ».
- Tu n'accuses personne et tu ne conclus sur aucune affaire. Tu peux signaler
  qu'une question reste sans réponse ; jamais présenter un soupçon comme acquis.
- Tu ne déduis rien sur la vie privée, la santé, les opinions, la situation
  familiale ou financière d'une personne. Si le matériau en contient, tu l'ignores.
- Ce qui manque, tu l'écris « non renseigné dans ces sources » — tu ne combles
  jamais un vide par une hypothèse.
- Tu n'écris jamais au nom d'un journaliste réel et tu ne signes pas.
- Tu réponds en français, en Markdown, sans préambule.`;

const PLAN = `Rédige la synthèse avec exactement ces sections :

## En bref
Ce que l'ensemble du dossier permet de dire, en 3 phrases maximum.

## Solidement rapporté
Ce que plusieurs médias distincts rapportent de concert. Précise le nombre de
médias entre parenthèses. Si aucun sujet n'atteint deux médias, écris-le.

## À confirmer
Ce qui ne repose que sur un seul média. Formule-le comme une piste, pas un fait.

## Ce qui se contredit
Les points où les sources divergent, en présentant les deux versions sans
trancher. Écris « aucune contradiction visible » si c'est le cas.

## Zones d'ombre
Les questions que ce matériau laisse ouvertes, formulées comme des manques
d'information.

## Ce qu'il faudrait vérifier
3 à 5 vérifications concrètes : documents publics, registres officiels,
déclarations à recouper.

## Prudence
Une phrase sur ce que ces sources ne permettent PAS de conclure.`;

/* ------------------------------------------------------------------ */
/* Construction du prompt                                              */
/* ------------------------------------------------------------------ */

function resumerIdentite(fiche: Fiche | null): string {
  if (!fiche) {
    return "Fiche encyclopédique : aucune. Le sujet n'a pas de page Wikipédia — traite-le avec d'autant plus de prudence.";
  }

  const lignes = [
    `Fiche encyclopédique — ${fiche.titre}${fiche.description ? ` (${fiche.description})` : ""}`,
  ];
  if (fiche.age !== null) lignes.push(`Âge : ${fiche.age} ans`);
  for (const f of fiche.faits) lignes.push(`${f.label} : ${f.valeurs.join(", ")}`);
  for (const l of fiche.listes) lignes.push(`${l.label} : ${l.valeurs.join(", ")}`);
  if (fiche.biographie) lignes.push(`Résumé : ${fiche.biographie.slice(0, 900)}`);

  return lignes.join("\n");
}

function resumerThemes(themes: Theme[]): string {
  return themes
    .slice(0, 12)
    .map((t, i) => {
      const titres = t.articles
        .slice(0, 6)
        .map((a) => `     · « ${a.titre} » — ${a.source}${a.date ? ` (${a.date})` : ""}`)
        .join("\n");

      return `${i + 1}. [${t.niveau} — ${t.sources.length} média(s) distinct(s) : ${t.sources.join(", ")}]\n${titres}`;
    })
    .join("\n\n");
}

function construirePrompt(
  nom: string,
  fiche: Fiche | null,
  themes: Theme[],
  chronologie: Jour[],
  focus?: string,
): string {
  const periode =
    chronologie.length > 0
      ? `Période couverte : du ${chronologie[chronologie.length - 1].libelle} au ${chronologie[0].libelle}.`
      : "Aucune date exploitable dans ce corpus.";

  return `Sujet du dossier : ${nom}${focus ? `\nAngle demandé : ${focus}` : ""}

${resumerIdentite(fiche)}

${periode}

Sujets de presse regroupés, du plus corroboré au moins corroboré :

${resumerThemes(themes)}

${PLAN}`;
}

/* ------------------------------------------------------------------ */
/* Moteurs                                                             */
/* ------------------------------------------------------------------ */

// Mode gratuit : Pollinations.ai, sans clé API.
async function synthetiserGratuit(prompt: string): Promise<string> {
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
      "Le service de synthèse gratuit est saturé. Réessayez dans quelques instants.",
    );
  }

  const data = await res.json();
  const texte: string = data?.choices?.[0]?.message?.content ?? "";
  if (!texte.trim()) throw new Error("Le service gratuit a renvoyé une réponse vide.");
  return texte;
}

// Mode premium : Claude, si une clé Anthropic est configurée.
async function synthetiserClaude(prompt: string): Promise<string> {
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
      "La synthèse a été refusée par les filtres de sécurité du modèle pour ce sujet.",
    );
  }

  return reponse.content
    .filter((bloc) => bloc.type === "text")
    .map((bloc) => (bloc as { text: string }).text)
    .join("\n")
    .trim();
}

/* ------------------------------------------------------------------ */

export type Dossier = {
  nom: string;
  fiche: Fiche | null;
  articles: Article[];
  angles: string[];
  themes: Theme[];
  chronologie: Jour[];
  signaux: Signal[];
  synthese: string;
  moteur: "Claude" | "gratuit";
};

export async function POST(req: Request) {
  let nom: unknown;
  let focus: unknown;

  try {
    ({ nom, focus } = await req.json());
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  if (typeof nom !== "string" || !nom.trim()) {
    return Response.json({ error: "Indiquez un sujet à documenter." }, { status: 400 });
  }

  const sujet = nom.trim();
  const angle = typeof focus === "string" && focus.trim() ? focus.trim() : undefined;

  try {
    // Encyclopédie et presse sont indépendantes : on les charge en parallèle.
    const [ficheRes, corpusRes] = await Promise.allSettled([
      resoudreIdentite(sujet),
      collecterCorpus(sujet, angle),
    ]);

    const fiche = ficheRes.status === "fulfilled" ? ficheRes.value : null;

    if (corpusRes.status === "rejected") {
      throw new Error(
        corpusRes.reason?.message ?? "La collecte de presse a échoué.",
      );
    }
    const { articles, angles } = corpusRes.value;

    // Ni page encyclopédique, ni couverture de presse : le sujet n'a pas
    // d'existence publique documentée. On refuse plutôt que de spéculer —
    // c'est exactement le cas d'une personne privée.
    if (!fiche && articles.length < SEUIL_PUBLIC) {
      return Response.json(
        {
          error:
            `Aucune source publique sur « ${sujet} » : ni page encyclopédique, ni couverture de presse significative. ` +
            `Cet outil ne travaille que sur ce qui est déjà publié — il n'a rien d'autre à interroger. ` +
            `S'il s'agit d'une personne connue, vérifiez l'orthographe ou ajoutez un élément de contexte.`,
        },
        { status: 422 },
      );
    }

    const themes = regrouperThemes(articles, sujet);
    const chronologie = construireChronologie(articles);
    const signaux = detecterSignaux(themes, articles);

    const prompt = construirePrompt(sujet, fiche, themes, chronologie, angle);
    const synthese = process.env.ANTHROPIC_API_KEY
      ? await synthetiserClaude(prompt)
      : await synthetiserGratuit(prompt);

    const dossier: Dossier = {
      nom: sujet,
      fiche,
      articles,
      angles,
      themes,
      chronologie,
      signaux,
      synthese,
      moteur: process.env.ANTHROPIC_API_KEY ? "Claude" : "gratuit",
    };

    return Response.json(dossier);
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "La construction du dossier a échoué." },
      { status: 502 },
    );
  }
}
