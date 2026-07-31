import Anthropic from "@anthropic-ai/sdk";
import { extraireAnalyse } from "./analyse";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Studio TikTok : trois outils qui partagent le même moteur de texte.
 *
 * - « idees » : des concepts de vidéos complets (accroche, script minuté, CTA).
 * - « score » : une note de viralité argumentée sur un script fourni.
 * - « plan »  : une semaine de publication cohérente pour une niche.
 *
 * Comme le reste de l'application : gratuit sans clé (Pollinations.ai),
 * et bascule sur Claude si ANTHROPIC_API_KEY est présente.
 */

/* ------------------------------------------------------------------ */
/* Ce que l'IA doit savoir de TikTok                                   */
/* ------------------------------------------------------------------ */

const CADRE = `Tu es un créateur de contenu court qui a fait tourner des centaines de vidéos sur TikTok, Reels et Shorts. Tu conseilles un créateur francophone.

Ce que tu sais du format et qui guide chacun de tes conseils :
- Tout se joue dans les 2 premières secondes. Si le spectateur ne comprend pas immédiatement ce qu'il gagne à rester, il glisse. L'accroche est la seule chose qui n'est jamais négociable.
- L'algorithme récompense le temps de visionnage rapporté à la durée, pas la durée elle-même. Une vidéo de 18 secondes vue en entier bat une vidéo de 60 secondes abandonnée à la moitié.
- Les commentaires pèsent plus lourd que les likes. Une vidéo qui donne envie de répondre, corriger ou raconter son propre cas est relancée par l'algorithme.
- Les partages en message privé sont le signal le plus fort : on partage ce qui est utile, drôle ou qui fait penser à quelqu'un en particulier.
- Une boucle propre (la fin donne envie de revoir le début) fait exploser le taux de rétention sans effort supplémentaire.
- Le texte à l'écran dans la première seconde est lu même son coupé. C'est souvent lui qui retient, pas la voix.
- Rester sur une même niche entraîne l'algorithme à trouver la bonne audience. Sauter de sujet en sujet remet le compteur à zéro.

Règles d'écriture :
- Français simple et direct, tutoiement. Pas de jargon marketing, pas d'anglicismes inutiles.
- Concret et tournable dès aujourd'hui avec un téléphone : décris ce qu'on voit et ce qu'on dit, pas des intentions vagues.
- Jamais de promesse de résultat chiffré ni de « technique secrète ». La régularité et la qualité de l'accroche font le travail.
- Tu ne conseilles jamais de tromper le spectateur, d'inventer une histoire présentée comme vraie, ni d'acheter des vues.
- Tu réponds sans préambule ni conclusion sur toi-même.`;

/* ------------------------------------------------------------------ */
/* Les trois modes                                                     */
/* ------------------------------------------------------------------ */

type Mode = "idees" | "score" | "plan";

const OBJECTIFS: Record<string, string> = {
  abonnes: "gagner des abonnés fidèles sur la durée",
  vues: "faire un maximum de vues, quitte à viser large",
  vendre: "amener vers un produit, un service ou une commande",
  communaute: "faire réagir et créer une communauté qui commente",
};

function promptIdees(niche: string, objectif: string, format: string): string {
  return `Niche du créateur : ${niche}
Objectif principal : ${OBJECTIFS[objectif] ?? OBJECTIFS.vues}
Style de tournage possible : ${format}

Donne **5 concepts de vidéos** différents, pensés pour cette niche précise. Varie les angles : n'en fais pas cinq fois la même chose sous un autre nom.

Pour chacun, respecte exactement cette structure :

## 1. [Titre court du concept]

**L'accroche (0-2s)** — la phrase exacte à dire, entre guillemets. Elle doit tenir en une respiration.
**Le texte à l'écran** — ce qui s'affiche pendant ces 2 secondes, en 6 mots maximum.
**Le déroulé** — 3 à 5 étapes minutées, format « 0-3s : … ». Dis ce qu'on voit et ce qu'on entend.
**Le plan de fin** — comment tu boucles, et pourquoi ça donne envie de revoir le début.
**La phrase qui fait commenter** — une question ou une affirmation clivante à poser à la fin.
**Le son** — quel type de son chercher (tendance du moment, voix seule, musique calme…) et pourquoi celui-là.
**Les hashtags** — 5 maximum : 2 larges, 2 de niche, 1 très précis.
**Pourquoi ça peut marcher** — une phrase, franche. Et si le concept est risqué, dis-le.

Termine par une section « ## Par lequel commencer » : recommande un seul concept parmi les cinq, et explique en deux phrases pourquoi celui-là en premier.`;
}

function promptPlan(niche: string, objectif: string, format: string): string {
  return `Niche du créateur : ${niche}
Objectif principal : ${OBJECTIFS[objectif] ?? OBJECTIFS.vues}
Style de tournage possible : ${format}

Construis un **plan de publication sur 7 jours** pour quelqu'un qui démarre et qui n'a pas des heures par jour.

Commence par une section « ## Le fil rouge de la semaine » : en trois phrases, l'angle unique qui relie les 7 vidéos, pour que l'algorithme comprenne à qui montrer le compte.

Puis une section par jour, de ce format :

## Jour 1 — [type de vidéo]
**Sujet** — en une phrase.
**Accroche** — la phrase exacte, entre guillemets.
**À tourner** — ce qu'il faut filmer, concrètement, en une ou deux phrases.
**Objectif de la vidéo** — ce qu'elle doit produire (faire découvrir, faire commenter, faire enregistrer, amener vers le suivant).

Alterne les intentions sur la semaine : certaines vidéos servent à être découvert par des inconnus, d'autres à convertir ceux qui découvrent le compte, d'autres à faire réagir les habitués. Explique ce choix quand il n'est pas évident.

Termine par « ## Ce qu'il faut regarder au bout d'une semaine » : les 3 chiffres à observer dans les statistiques TikTok, ce que chacun veut dire, et la décision à prendre selon le résultat. Reste honnête : une semaine ne suffit pas à conclure, dis-le.`;
}

function promptScore(texte: string, niche: string): string {
  return `Voici le script ou l'accroche d'une vidéo courte, à évaluer${niche ? ` (niche : ${niche})` : ""} :

"""
${texte}
"""

Évalue-la honnêtement. Un mauvais score utile vaut mieux qu'un bon score complaisant : si l'accroche est faible, dis-le et montre comment la sauver.

Réponds **uniquement** avec un objet JSON valide, sans texte avant ni après, sans bloc de code markdown, exactement de cette forme :

{
  "note": 0,
  "verdict": "Deux phrases franches : ce que vaut cette vidéo en l'état, et ce qui la bloque le plus.",
  "criteres": [
    { "nom": "Accroche", "note": 0, "commentaire": "Une phrase précise sur ce script." },
    { "nom": "Rétention", "note": 0, "commentaire": "..." },
    { "nom": "Émotion", "note": 0, "commentaire": "..." },
    { "nom": "Partage", "note": 0, "commentaire": "..." },
    { "nom": "Commentaires", "note": 0, "commentaire": "..." }
  ],
  "corrections": [
    "Correction concrète et applicable, pas un conseil général.",
    "...",
    "..."
  ],
  "hooks": [
    "Réécriture complète de l'accroche, prête à être dite.",
    "...",
    "..."
  ]
}

Contraintes : "note" globale entre 0 et 100 ; chaque "note" de critère entre 0 et 20 et la note globale doit être leur somme ; exactement les 5 critères ci-dessus dans cet ordre ; 3 corrections ; 3 accroches de remplacement, toutes différentes de l'originale et différentes entre elles.`;
}

function construirePrompt(
  mode: Mode,
  niche: string,
  objectif: string,
  format: string,
  texte: string,
): string {
  if (mode === "score") return promptScore(texte, niche);
  if (mode === "plan") return promptPlan(niche, objectif, format);
  return promptIdees(niche, objectif, format);
}

/* ------------------------------------------------------------------ */
/* Moteurs                                                             */
/* ------------------------------------------------------------------ */

// Mode gratuit : Pollinations.ai, sans clé API.
async function genererGratuit(prompt: string): Promise<string> {
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
      "Le service gratuit est saturé pour le moment. Réessayez dans quelques instants.",
    );
  }

  const data = await res.json();
  const texte: string = data?.choices?.[0]?.message?.content ?? "";
  if (!texte.trim()) throw new Error("Le service gratuit a renvoyé une réponse vide.");
  return texte;
}

// Mode premium : Claude, si une clé Anthropic est configurée.
async function genererClaude(prompt: string): Promise<string> {
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
      "La demande a été refusée par les filtres de sécurité du modèle. Reformulez votre sujet.",
    );
  }

  return reponse.content
    .filter((bloc) => bloc.type === "text")
    .map((bloc) => (bloc as { text: string }).text)
    .join("\n")
    .trim();
}

/* ------------------------------------------------------------------ */

const MODES: Mode[] = ["idees", "score", "plan"];

export async function POST(req: Request) {
  let corps: Record<string, unknown>;

  try {
    corps = await req.json();
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  const mode: Mode = MODES.includes(corps.mode as Mode) ? (corps.mode as Mode) : "idees";
  const niche = typeof corps.niche === "string" ? corps.niche.trim().slice(0, 300) : "";
  const texte = typeof corps.texte === "string" ? corps.texte.trim().slice(0, 4000) : "";
  const objectif = typeof corps.objectif === "string" ? corps.objectif : "vues";
  const format =
    typeof corps.format === "string" && corps.format.trim()
      ? corps.format.trim().slice(0, 200)
      : "face caméra, au téléphone, sans matériel";

  if (mode === "score" && !texte) {
    return Response.json(
      { error: "Collez le script ou l'accroche à analyser." },
      { status: 400 },
    );
  }

  if (mode !== "score" && !niche) {
    return Response.json({ error: "Indiquez votre niche ou votre sujet." }, { status: 400 });
  }

  const premium = Boolean(process.env.ANTHROPIC_API_KEY);

  try {
    const prompt = construirePrompt(mode, niche, objectif, format, texte);
    const brut = premium ? await genererClaude(prompt) : await genererGratuit(prompt);

    if (mode === "score") {
      const analyse = extraireAnalyse(brut);
      // Si le JSON est illisible, on renvoie quand même le texte : l'analyse
      // reste utile, elle s'affichera simplement sans la jauge.
      return Response.json({
        mode,
        analyse,
        resultat: analyse ? null : brut,
        moteur: premium ? "Claude" : "gratuit",
      });
    }

    return Response.json({
      mode,
      resultat: brut,
      moteur: premium ? "Claude" : "gratuit",
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "La génération a échoué." },
      { status: 502 },
    );
  }
}
