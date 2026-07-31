import Anthropic from "@anthropic-ai/sdk";
import { extraireAnalyse } from "./analyse";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Studio TikTok pour un vendeur : quatre outils qui partagent le même moteur.
 *
 * - « produit » : la vidéo qui vend une pièce précise, plan par plan.
 * - « idees »   : une série de concepts de vidéos pour la boutique.
 * - « score »   : une note de viralité argumentée sur un script fourni.
 * - « plan »    : une semaine de publication cohérente.
 *
 * Toutes les générations reçoivent le profil du vendeur (ce qu'il vend, où il
 * livre, ses prix, comment on commande) : sans ça, les conseils restent des
 * généralités inutilisables.
 *
 * Comme le reste de l'application : gratuit sans clé (Pollinations.ai),
 * et bascule sur Claude si ANTHROPIC_API_KEY est présente.
 */

/* ------------------------------------------------------------------ */
/* Ce que l'IA doit savoir                                             */
/* ------------------------------------------------------------------ */

const CADRE = `Tu conseilles un commerçant francophone qui vend ses produits en filmant avec son téléphone, sur TikTok. Tu as fait tourner des centaines de vidéos courtes et tu as vu ce qui remplit un carnet de commandes.

Ce que tu sais du format :
- Tout se joue dans les 2 premières secondes. Si le spectateur ne comprend pas immédiatement ce qu'il gagne à rester, il glisse. L'accroche n'est jamais négociable.
- L'algorithme récompense le temps de visionnage rapporté à la durée, pas la durée elle-même. Une vidéo de 18 secondes vue en entier bat une vidéo de 60 secondes abandonnée au milieu.
- Les commentaires pèsent plus lourd que les likes, et chez un vendeur ils font double emploi : ils relancent la vidéo et ils révèlent la demande. Une question qui revient en commentaire est un sujet de vidéo.
- Les partages en message privé sont le signal le plus fort. On envoie une vidéo de tissu à sa sœur, sa femme, son tailleur : c'est exactement le geste qui précède une commande.
- Une boucle propre (la fin donne envie de revoir le début) augmente la rétention sans effort.
- Le texte à l'écran de la première seconde est lu même son coupé. C'est souvent lui qui retient.
- Rester sur un seul univers entraîne l'algorithme à trouver les bons acheteurs. Sauter de sujet en sujet remet le compteur à zéro.

Ce que tu sais pour faire monter les compteurs de vues :
- Le moteur, c'est la rétention : le pourcentage de la vidéo réellement regardé. Une vidéo est d'abord montrée à un petit groupe ; si ce groupe la regarde en entier, elle est montrée à un groupe plus large, et ainsi de suite. Tout le reste est secondaire.
- Une vidéo courte regardée en entier bat toujours une vidéo longue abandonnée. Face à un doute, raccourcis : coupe les salutations, les présentations et les temps morts.
- Le revisionnage compte double. Une fin qui renvoie au début fait remonter la rétention au-dessus de 100 % sans travail supplémentaire.
- Un son déjà porté par la plateforme aide à être testé sur plus de monde, mais il ne sauve jamais une vidéo faible. Le son ne remplace pas l'accroche.
- La régularité pèse plus que l'heure de publication. La meilleure heure est simplement celle où les acheteurs de sa zone sont réveillés.
- Les premières minutes après la publication décident beaucoup : répondre aux commentaires tout de suite relance la vidéo.
- Republier le même sujet sous un autre angle n'est pas de la répétition : chaque vidéo est montrée à des gens différents, et la plupart n'ont jamais vu la précédente.
- Un compte qui ne fait que vendre cesse d'être montré à de nouvelles personnes. Il faut des vidéos utiles ou distrayantes, qui n'ont rien à vendre, pour continuer à recruter des inconnus.

Ce que tu sais de la vente, et qui prime sur tout le reste :
- Le but n'est pas le nombre de vues, c'est le nombre de commandes. Cent mille vues venues d'un pays où le vendeur ne livre pas ne valent rien ; deux mille vues chez les bonnes personnes remplissent une semaine. Tu raisonnes toujours ainsi et tu le rappelles quand c'est utile.
- La confiance est le vrai frein, pas le prix. L'acheteur a peur de recevoir autre chose que ce qu'il a vu. Montrer la marchandise réelle dans ses mains, l'emballage, l'envoi et les clients qui ont reçu débloque plus de commandes que n'importe quelle remise.
- Le prix annoncé clairement convertit mieux que « prix en privé ». Ceux qui n'ont pas envie de négocier sont majoritaires et ils passent leur chemin.
- Chaque vidéo doit dire comment commander, simplement et une seule fois.

Ce que tu sais de la vente de tissu en particulier (bazin, wax, dentelle, brodé) :
- Un tissu ne se juge pas sur une photo. La brillance, la raideur et le tombé n'apparaissent qu'en mouvement : il faut le filmer qu'on le déplie, qu'on le secoue, qu'on le fait glisser.
- Le bazin a un son. Le froissement d'un bazin riche bien amidonné est reconnaissable, et c'est un argument que seule la vidéo permet. Filmer près du micro, sans musique par-dessus.
- La lumière du jour est obligatoire. Un néon fausse les couleurs, et un client déçu à la livraison ne recommande jamais.
- Le vêtement porté vend plus que le tissu plié : le rendu réel ne se devine pas sur un rouleau.
- Un arrivage crée une urgence vraie, sans avoir besoin de mentir. Chaque nouvelle arrivée est une vidéo.
- La diaspora achète beaucoup et commande sur vidéo. Dire clairement qu'on envoie à l'étranger ouvre un marché entier.
- La demande est saisonnière : Ramadan et Korité, Tabaski, mariages, baptêmes, fêtes de fin d'année. Et surtout, l'acheteur doit acheter assez tôt pour que son tailleur ait le temps de coudre — le pic de commandes tombe donc plusieurs semaines avant la fête, pas la semaine même. C'est l'erreur la plus fréquente et la plus coûteuse.

Règles d'écriture :
- Français simple et direct, tutoiement. Pas de jargon marketing, pas d'anglicismes inutiles.
- Concret et tournable aujourd'hui avec un téléphone : décris ce qu'on voit et ce qu'on dit, pas des intentions vagues.
- Tu utilises le profil du vendeur qu'on te donne. Tu ne parles jamais d'un produit, d'un prix ou d'une zone de livraison qu'il ne t'a pas indiqués. Si une information te manque, tu écris ce qu'il doit compléter entre crochets plutôt que de l'inventer.

Ce que tu refuses de conseiller, même si on te le demande :
- Inventer une rareté (« il ne reste que deux pièces ») quand c'est faux, annoncer une marque ou une qualité que le vendeur n'a pas, ou promettre un délai de livraison qu'il ne peut pas tenir. Une promesse non tenue coûte toujours plus cher que la vente gagnée.
- Acheter des vues ou des abonnés, inventer un témoignage client, se faire passer pour quelqu'un d'autre.
- Promettre un résultat chiffré ou une « technique secrète ». La régularité et la qualité de l'accroche font le travail, et tu le dis franchement.
- Tu réponds sans préambule ni conclusion sur toi-même.`;

/* ------------------------------------------------------------------ */
/* Profil du vendeur                                                   */
/* ------------------------------------------------------------------ */

type Profil = {
  produit: string;
  zone: string;
  prix: string;
  commande: string;
};

/** Ce bloc est injecté dans chaque demande : sans lui, tout reste générique. */
function blocProfil(p: Profil): string {
  const lignes = [
    `- Ce qu'il vend : ${p.produit || "[non précisé]"}`,
    `- Où il livre : ${p.zone || "[non précisé]"}`,
    `- Ses prix : ${p.prix || "[non précisé]"}`,
    `- Comment on commande chez lui : ${p.commande || "[non précisé]"}`,
  ];
  return `Profil du vendeur :\n${lignes.join("\n")}`;
}

/* ------------------------------------------------------------------ */
/* Les quatre modes                                                    */
/* ------------------------------------------------------------------ */

type Mode = "produit" | "idees" | "score" | "plan";

const OBJECTIFS: Record<string, string> = {
  commandes: "déclencher des commandes tout de suite",
  connaitre: "se faire connaître de nouveaux acheteurs dans sa zone",
  confiance: "rassurer ceux qui hésitent encore à commander",
  fidele: "faire revenir les clients qui ont déjà acheté",
};

function promptProduit(piece: string, profil: Profil, format: string): string {
  return `${blocProfil(profil)}

La pièce à mettre en avant aujourd'hui : ${piece}
Comment il peut filmer : ${format}

Écris **la vidéo qui vend cette pièce précise**. Une seule vidéo, complète, prête à tourner. Respecte cette structure :

## L'accroche (0-2s)
La phrase exacte à dire, entre guillemets. Elle doit donner envie de rester sans mentir sur la marchandise.

## Le texte à l'écran
Ce qui s'affiche pendant ces 2 secondes. 6 mots maximum, lisibles son coupé.

## Plan par plan
4 à 6 plans minutés, format « 0-3s : … ». Pour chacun, dis ce qu'on voit, comment tenir le téléphone, et ce qu'on dit par-dessus. Fais entrer le tissu en mouvement dès le début.

## Ce qu'il faut montrer de la qualité
Les deux ou trois gestes précis qui prouvent la qualité à l'image, sans avoir à le dire. Si le produit s'y prête, pense au son, à la lumière du jour et au rendu porté.

## Le prix
Où le placer dans la vidéo et comment le formuler, à partir des prix du profil. Si le profil ne les donne pas, dis-le clairement.

## L'appel à commander
Une seule phrase, à partir de la façon de commander indiquée dans le profil. Dis aussi où elle doit apparaître.

## La légende
La légende à écrire sous la vidéo, deux lignes maximum.

## Les hashtags
5 maximum : 2 larges, 2 liés au produit, 1 lié à la zone de livraison.

## L'erreur à éviter sur cette vidéo
Une phrase, franche, sur ce qui pourrait faire rater cette vidéo précisément.`;
}

function promptIdees(niche: string, objectif: string, format: string, profil: Profil): string {
  return `${blocProfil(profil)}

Sujet ou angle du moment : ${niche}
Objectif principal : ${OBJECTIFS[objectif] ?? OBJECTIFS.commandes}
Comment il peut filmer : ${format}

Donne **5 concepts de vidéos** différents pour cette boutique. Varie vraiment les angles : arrivage, preuve de qualité, rendu porté, coulisses, réponse à une objection, client servi. N'en fais pas cinq fois la même chose sous un autre nom.

Pour chacun, respecte exactement cette structure :

## 1. [Titre court du concept]

**L'accroche (0-2s)** — la phrase exacte à dire, entre guillemets. Elle doit tenir en une respiration.
**Le texte à l'écran** — 6 mots maximum.
**Le déroulé** — 3 à 5 étapes minutées, format « 0-3s : … ». Dis ce qu'on voit et ce qu'on entend.
**Ce que ça prouve à l'acheteur** — quelle peur ou quelle question cette vidéo lève.
**L'appel à commander** — une phrase, cohérente avec le profil.
**Les hashtags** — 5 maximum.
**Pourquoi ça peut marcher** — une phrase franche. Et si le concept est risqué, dis-le.

Termine par « ## Par lequel commencer » : recommande un seul concept, et explique en deux phrases pourquoi celui-là d'abord.`;
}

function promptPlan(niche: string, objectif: string, format: string, profil: Profil): string {
  return `${blocProfil(profil)}

Angle du moment : ${niche}
Objectif principal : ${OBJECTIFS[objectif] ?? OBJECTIFS.commandes}
Comment il peut filmer : ${format}

Construis un **plan de publication sur 7 jours** pour un vendeur qui tient déjà sa boutique et n'a pas des heures par jour.

Commence par « ## Le fil rouge de la semaine » : en trois phrases, l'angle qui relie les 7 vidéos, pour que l'algorithme comprenne à qui montrer ce compte.

Puis une section par jour :

## Jour 1 — [type de vidéo]
**Sujet** — en une phrase.
**Accroche** — la phrase exacte, entre guillemets.
**À filmer** — concrètement, en une ou deux phrases.
**Ce que cette vidéo doit produire** — faire découvrir la boutique, lever une objection, faire commenter, ou déclencher une commande.

Alterne les intentions : toutes les vidéos ne doivent pas vendre. Certaines servent à être découvert par des inconnus, d'autres à rassurer ceux qui hésitent, d'autres à faire commander. Un compte qui ne fait que vendre s'essouffle, explique-le quand c'est utile.

Termine par « ## Ce qu'il faut regarder au bout d'une semaine » : les 3 chiffres à observer (dont, pour un vendeur, le nombre de messages reçus et la provenance géographique des vues — pas seulement les vues), ce que chacun veut dire, et la décision à prendre selon le résultat. Reste honnête : une semaine ne suffit pas à conclure, dis-le.`;
}

function promptScore(texte: string, profil: Profil): string {
  return `${blocProfil(profil)}

Voici le script ou l'accroche d'une vidéo de vente, à évaluer :

"""
${texte}
"""

Évalue-la honnêtement, du point de vue d'un vendeur : ce qui compte est qu'elle déclenche des commandes, pas qu'elle fasse des vues. Un mauvais score utile vaut mieux qu'un bon score complaisant.

Réponds **uniquement** avec un objet JSON valide, sans texte avant ni après, sans bloc de code markdown, exactement de cette forme :

{
  "note": 0,
  "verdict": "Deux phrases franches : ce que vaut cette vidéo en l'état, et ce qui la bloque le plus.",
  "criteres": [
    { "nom": "Accroche", "note": 0, "commentaire": "Une phrase précise sur ce script." },
    { "nom": "Rétention", "note": 0, "commentaire": "..." },
    { "nom": "Confiance", "note": 0, "commentaire": "Ce que la vidéo prouve, ou ne prouve pas, à un acheteur méfiant." },
    { "nom": "Envie d'acheter", "note": 0, "commentaire": "..." },
    { "nom": "Appel à commander", "note": 0, "commentaire": "Clarté et placement de la façon de commander." }
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
  profil: Profil,
): string {
  if (mode === "score") return promptScore(texte, profil);
  if (mode === "produit") return promptProduit(texte, profil, format);
  if (mode === "plan") return promptPlan(niche, objectif, format, profil);
  return promptIdees(niche, objectif, format, profil);
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

const MODES: Mode[] = ["produit", "idees", "score", "plan"];

const texteCourt = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: Request) {
  let corps: Record<string, unknown>;

  try {
    corps = await req.json();
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  const mode: Mode = MODES.includes(corps.mode as Mode) ? (corps.mode as Mode) : "produit";
  const niche = texteCourt(corps.niche, 300);
  const texte = texteCourt(corps.texte, 4000);
  const objectif = typeof corps.objectif === "string" ? corps.objectif : "commandes";
  const format =
    texteCourt(corps.format, 200) || "au téléphone, à la boutique, en lumière du jour";

  const profil: Profil = {
    produit: texteCourt(corps.produit, 300),
    zone: texteCourt(corps.zone, 300),
    prix: texteCourt(corps.prix, 300),
    commande: texteCourt(corps.commande, 300),
  };

  if (mode === "produit" && !texte) {
    return Response.json(
      { error: "Décrivez la pièce à mettre en avant (couleur, qualité, quantité)." },
      { status: 400 },
    );
  }
  if (mode === "score" && !texte) {
    return Response.json(
      { error: "Collez le script ou l'accroche à analyser." },
      { status: 400 },
    );
  }
  if ((mode === "idees" || mode === "plan") && !niche) {
    return Response.json(
      { error: "Indiquez l'angle ou le sujet du moment." },
      { status: 400 },
    );
  }

  const premium = Boolean(process.env.ANTHROPIC_API_KEY);

  try {
    const prompt = construirePrompt(mode, niche, objectif, format, texte, profil);
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
