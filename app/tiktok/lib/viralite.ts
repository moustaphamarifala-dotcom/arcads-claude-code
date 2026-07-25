/**
 * Moteur d'analyse de viralité — 100 % local, aucune clé API, aucun appel réseau.
 *
 * Le score n'est pas une prédiction magique : c'est un audit. Chaque critère
 * correspond à un mécanisme mesurable de l'algorithme TikTok (rétention des
 * 3 premières secondes, taux de complétion, partages, clics profil, recherche).
 * Chaque point perdu vient avec un correctif concret et applicable.
 */

export interface EntreeAnalyse {
  hook: string;
  script: string;
  legende: string;
  hashtags: string;
  dureeSec: number;
}

export interface Critere {
  id: string;
  nom: string;
  poids: number;
  score: number;
  role: string;
  constats: string[];
  correctifs: string[];
}

export interface Analyse {
  score: number;
  mention: string;
  couleur: string;
  criteres: Critere[];
  vuesEstimees: [number, number];
  levierPrioritaire: string;
}

/* ────────────────────────────  Dictionnaires  ──────────────────────────── */

const MOTS_INTERRUPTION = [
  "arrête", "arrêtez", "arrete", "stop", "attention", "jamais", "personne",
  "erreur", "erreurs", "secret", "vérité", "verite", "attends", "attendez",
  "surtout pas", "oublie", "oubliez", "ne fais pas", "ne faites pas",
  "grosse erreur", "piège", "piege", "arnaque",
];

const MOTS_CURIOSITE = [
  "pourquoi", "comment", "ce que", "voici", "révèle", "revele", "personne ne",
  "j'aurais aimé", "jusqu'à la fin", "jusqu'a la fin", "la suite", "regarde bien",
  "regardez bien", "devine", "tu ne vas pas croire", "vous n'allez pas croire",
  "ce détail", "ce detail", "résultat", "resultat",
];

const MOTS_EMOTION = [
  "choqué", "choque", "incroyable", "fou", "folle", "honte", "fier", "fière",
  "pleuré", "pleure", "rêve", "reve", "galère", "galere", "trahison",
  "magnifique", "sublime", "waouh", "wow", "j'ai osé", "j'ai ose", "j'ai eu peur",
  "hallucinant", "dingue",
];

const MOTS_ARGENT = [
  "franc", "fcfa", "f cfa", "prix", "gratuit", "rentable", "bénéfice", "benefice",
  "gagner", "coûte", "coute", "moins cher", "économise", "economise", "vendu",
  "commande", "budget", "investir", "marge", "revenu",
];

const MOTS_CTA = [
  "commente", "commentez", "écris", "ecris", "écrivez", "ecrivez", "dm",
  "message privé", "message prive", "lien en bio", "en bio", "abonne", "abonnez",
  "partage", "partagez", "enregistre", "enregistrez", "clique", "cliquez",
  "whatsapp", "appelle", "appelez", "réserve", "reserve", "commande maintenant",
];

const MOTS_URGENCE = [
  "aujourd'hui", "ce soir", "cette semaine", "dernier", "dernière", "derniere",
  "plus que", "limité", "limite", "vite", "avant que", "il reste", "stock",
  "dernières pièces", "dernieres pieces",
];

const MOTS_BOUCLE = [
  "mais", "sauf que", "sauf qu'", "attends", "le pire", "le meilleur", "et là",
  "et la", "sauf", "pourtant", "sauf qu", "puis", "ensuite", "alors que",
  "résultat", "resultat", "au final", "et devine",
];

const MOTS_SURVENTE = [
  "meilleur", "meilleure", "garanti", "garantie", "n°1", "numéro 1", "numero 1",
  "imbattable", "unique en son genre", "100%", "le plus grand", "le plus beau",
];

const OUVERTURES_FAIBLES = [
  "bonjour", "salut tout le monde", "bienvenue sur", "aujourd'hui je vais",
  "dans cette vidéo", "dans cette video", "comme vous le savez",
  "j'espère que vous allez bien", "j'espere que vous allez bien",
  "je m'appelle", "avant de commencer", "petite intro",
];

/* ────────────────────────────  Utilitaires  ──────────────────────────── */

const normaliser = (t: string) => t.toLowerCase().normalize("NFC");

function contient(texte: string, mots: string[]): string[] {
  const t = normaliser(texte);
  return mots.filter((m) => t.includes(normaliser(m)));
}

function compterMots(texte: string): number {
  return texte.trim().split(/\s+/).filter(Boolean).length;
}

function borner(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/* ────────────────────────────  Critères  ──────────────────────────── */

/** 0-3 s : la seule seconde qui décide si la vidéo est distribuée. */
function analyserHook(e: EntreeAnalyse): Critere {
  const constats: string[] = [];
  const correctifs: string[] = [];
  let score = 40;

  const hook = e.hook.trim();
  const mots = compterMots(hook);

  if (!hook) {
    return {
      id: "hook",
      nom: "Accroche (0-3 s)",
      poids: 28,
      score: 0,
      role: "Décide si TikTok montre la vidéo à plus de monde.",
      constats: [],
      correctifs: ["Écris une accroche : c'est 80 % du résultat. Sans elle, rien ne part."],
    };
  }

  if (mots <= 12 && mots >= 3) {
    score += 15;
    constats.push(`Accroche courte (${mots} mots) — elle tient en 3 secondes.`);
  } else if (mots > 12) {
    score -= 10;
    correctifs.push(
      `Accroche trop longue (${mots} mots). Coupe à 8-12 mots maximum : on doit pouvoir la dire en 3 secondes.`,
    );
  } else {
    correctifs.push("Accroche trop courte pour créer une tension. Vise 6 à 12 mots.");
  }

  const interruptions = contient(hook, MOTS_INTERRUPTION);
  if (interruptions.length) {
    score += 14;
    constats.push(`Rupture de scroll détectée : « ${interruptions[0]} ».`);
  } else {
    correctifs.push(
      "Ajoute un mot qui casse le scroll : « arrête », « erreur », « personne ne », « jamais », « la vérité sur ».",
    );
  }

  const curiosite = contient(hook, MOTS_CURIOSITE);
  if (curiosite.length) {
    score += 12;
    constats.push("L'accroche ouvre une boucle de curiosité — le spectateur veut la réponse.");
  } else {
    correctifs.push(
      "Ouvre une boucle : promets une information que le spectateur n'aura qu'en restant (« voici pourquoi… », « ce détail change tout »).",
    );
  }

  if (/\d/.test(hook)) {
    score += 8;
    constats.push("Présence d'un chiffre — le cerveau s'accroche aux chiffres.");
  } else {
    correctifs.push("Mets un chiffre concret : un prix, une durée, un nombre d'erreurs.");
  }

  if (/\b(tu|toi|ton|ta|tes|vous|votre|vos)\b/i.test(hook)) {
    score += 8;
    constats.push("Adresse directe au spectateur.");
  } else {
    correctifs.push("Parle à UNE personne : « toi qui… », « si tu… ». Pas « les gens ».");
  }

  if (hook.includes("?")) {
    score += 5;
    constats.push("Question posée dès la première seconde.");
  }

  const faibles = contient(hook, OUVERTURES_FAIBLES);
  if (faibles.length) {
    score -= 30;
    correctifs.push(
      `Supprime « ${faibles[0]} ». Les politesses et les intros tuent la rétention : entre directement dans le sujet.`,
    );
  }

  return {
    id: "hook",
    nom: "Accroche (0-3 s)",
    poids: 28,
    score: borner(score),
    role: "Décide si TikTok montre la vidéo à plus de monde.",
    constats,
    correctifs,
  };
}

/** Taux de complétion et rewatch : le signal n°1 après le hook. */
function analyserRetention(e: EntreeAnalyse): Critere {
  const constats: string[] = [];
  const correctifs: string[] = [];
  let score = 45;

  const script = e.script.trim();
  const mots = compterMots(script);

  if (!script) {
    return {
      id: "retention",
      nom: "Rétention (corps de la vidéo)",
      poids: 22,
      score: 0,
      role: "Fait regarder jusqu'au bout — c'est ce qui déclenche la vague de vues.",
      constats: [],
      correctifs: ["Écris le script scène par scène pour contrôler le rythme."],
    };
  }

  // Débit de parole confortable en français : ~2,5 mots/seconde.
  const dureeParlee = mots / 2.5;
  const ratio = e.dureeSec > 0 ? dureeParlee / e.dureeSec : 1;

  if (ratio > 1.2) {
    score -= 12;
    correctifs.push(
      `Trop de texte pour ${e.dureeSec} s (il faudrait ~${Math.round(dureeParlee)} s pour tout dire). Coupe ${Math.round((ratio - 1) * 100)} % du script ou allonge la vidéo.`,
    );
  } else if (ratio < 0.5) {
    score -= 6;
    correctifs.push(
      "Beaucoup de silence pour cette durée. Soit tu raccourcis la vidéo, soit tu ajoutes du contenu — les temps morts font scroller.",
    );
  } else {
    score += 12;
    constats.push("Densité de parole cohérente avec la durée annoncée.");
  }

  const boucles = contient(script, MOTS_BOUCLE);
  if (boucles.length >= 3) {
    score += 16;
    constats.push(`${boucles.length} relances de tension détectées (« mais », « sauf que », « et là »…).`);
  } else if (boucles.length >= 1) {
    score += 8;
    constats.push("Quelques relances de tension présentes.");
    correctifs.push("Ajoute une relance toutes les 5 secondes : « mais attends », « sauf que… », « et le pire ».");
  } else {
    correctifs.push(
      "Aucune relance : le spectateur décroche vers la 5ᵉ seconde. Place un « mais » ou un « sauf que » régulièrement.",
    );
  }

  const lignes = script.split(/\n+/).filter((l) => l.trim().length > 0);
  if (lignes.length >= 4) {
    score += 12;
    constats.push(`${lignes.length} plans/scènes — le changement d'image relance l'attention.`);
  } else {
    correctifs.push(
      "Découpe en au moins 4 plans différents. Un plan fixe de 30 s perd la moitié de l'audience.",
    );
  }

  if (/\b(avant|après|apres)\b/i.test(script)) {
    score += 8;
    constats.push("Structure avant/après — format à très forte rétention.");
  }

  if (/\b(1|2|3|premier|deuxième|deuxieme|troisième|troisieme|étape|etape)\b/i.test(script)) {
    score += 7;
    constats.push("Progression numérotée : le spectateur reste pour connaître la suite.");
  }

  return {
    id: "retention",
    nom: "Rétention (corps de la vidéo)",
    poids: 22,
    score: borner(score),
    role: "Fait regarder jusqu'au bout — c'est ce qui déclenche la vague de vues.",
    constats,
    correctifs,
  };
}

/** Partages et commentaires : ce qui pousse la vidéo hors de ton audience. */
function analyserEmotion(e: EntreeAnalyse): Critere {
  const constats: string[] = [];
  const correctifs: string[] = [];
  let score = 40;

  const tout = `${e.hook}\n${e.script}\n${e.legende}`;

  const emotions = contient(tout, MOTS_EMOTION);
  if (emotions.length >= 2) {
    score += 22;
    constats.push(`Charge émotionnelle forte (« ${emotions.slice(0, 2).join(" », « ")} »).`);
  } else if (emotions.length === 1) {
    score += 10;
    constats.push("Une note émotionnelle présente.");
    correctifs.push("Monte d'un cran : raconte ce que tu as ressenti, pas seulement ce que tu as fait.");
  } else {
    correctifs.push(
      "Contenu trop neutre pour être partagé. On partage ce qui fait réagir : une fierté, une galère, une injustice, une surprise.",
    );
  }

  if (contient(tout, MOTS_ARGENT).length) {
    score += 14;
    constats.push("Le sujet touche à l'argent ou au prix — sujet à fort taux de commentaires.");
  } else {
    correctifs.push("Parle du prix ou du coût réel : c'est le sujet qui déclenche le plus de commentaires.");
  }

  if (/\b(je|j'|mon|ma|mes)\b/i.test(tout)) {
    score += 12;
    constats.push("Récit à la première personne — crée de l'attachement.");
  } else {
    correctifs.push("Passe à la première personne : on suit une personne, pas une marque.");
  }

  if (/\b(toi aussi|comme moi|si tu es|on est nombreux|vous aussi)\b/i.test(tout)) {
    score += 12;
    constats.push("Effet miroir : le spectateur se reconnaît, donc il envoie la vidéo à un proche.");
  } else {
    correctifs.push(
      "Ajoute une phrase d'identification (« si toi aussi tu… ») : c'est ce qui déclenche l'envoi en privé.",
    );
  }

  return {
    id: "emotion",
    nom: "Émotion & partage",
    poids: 12,
    score: borner(score),
    role: "Pousse la vidéo au-delà de tes abonnés (partages, commentaires).",
    constats,
    correctifs,
  };
}

/** Ce qui transforme les vues en argent. */
function analyserConversion(e: EntreeAnalyse): Critere {
  const constats: string[] = [];
  const correctifs: string[] = [];
  let score = 30;

  const tout = `${e.script}\n${e.legende}`;

  const ctas = contient(tout, MOTS_CTA);
  if (ctas.length >= 1) {
    score += 28;
    constats.push(`Appel à l'action présent : « ${ctas[0]} ».`);
  } else {
    correctifs.push(
      "Aucun appel à l'action. Une vue sans instruction ne rapporte rien : termine par « écris-moi BAZIN en commentaire » ou « lien WhatsApp en bio ».",
    );
  }

  if (ctas.length > 3) {
    score -= 12;
    correctifs.push(
      "Trop d'appels à l'action différents. Un seul par vidéo, sinon personne n'en fait aucun.",
    );
  }

  if (/\b(commente|commentez|écris|ecris|écrivez|ecrivez)\b/i.test(tout)) {
    score += 16;
    constats.push("Commentaire demandé — double effet : conversion + signal algorithmique.");
  } else {
    correctifs.push(
      "Demande un mot-clé en commentaire (« écris PRIX »). Ça déclenche l'algorithme ET remplit tes messages.",
    );
  }

  if (contient(tout, MOTS_URGENCE).length) {
    score += 14;
    constats.push("Notion d'urgence ou de rareté présente.");
  } else {
    correctifs.push("Ajoute une raison d'agir maintenant : stock limité, prix jusqu'à dimanche, série unique.");
  }

  if (/\b(bio|whatsapp|lien|dm|message)\b/i.test(tout)) {
    score += 12;
    constats.push("Chemin de contact explicite.");
  } else {
    correctifs.push("Dis où te joindre. « Lien WhatsApp en bio » doit être prononcé À VOIX HAUTE, pas seulement écrit.");
  }

  return {
    id: "conversion",
    nom: "Conversion (vues → argent)",
    poids: 13,
    score: borner(score),
    role: "Transforme l'audience en messages, puis en commandes.",
    constats,
    correctifs,
  };
}

/**
 * Freins de distribution : ce qui empêche la vidéo d'être montrée, quelle que
 * soit sa qualité. Une vidéo excellente qui pousse hors de TikTok sort moins
 * qu'une vidéo moyenne qui garde l'utilisateur sur la plateforme.
 */
function analyserDistribution(e: EntreeAnalyse): Critere {
  const constats: string[] = [];
  const correctifs: string[] = [];
  let score = 100;

  const tout = `${e.hook}\n${e.script}\n${e.legende}`;

  // Un numéro : au moins 8 chiffres, séparateurs tolérés. Les prix (« 10 000 F ») ne matchent pas.
  const suites = tout.match(/\+?\d[\d\s.-]{6,}\d/g) ?? [];
  const telephones = suites.filter((s) => s.replace(/\D/g, "").length >= 8);
  if (telephones.length) {
    score -= 40;
    correctifs.push(
      `Un numéro de téléphone apparaît (« ${telephones[0].trim()} »). C'est le frein de distribution le plus coûteux : TikTok réduit la portée de tout ce qui fait sortir de l'application. Mets-le dans le lien de ton profil — même information, cliquable, sans pénalité.`,
    );
  } else {
    constats.push("Aucun numéro de téléphone dans le texte.");
  }

  if (/instagram|facebook|snapchat|telegram|https?:\/\/|www\.|\.com\b|\.fr\b/i.test(tout)) {
    score -= 25;
    correctifs.push(
      "Tu renvoies vers une autre plateforme. Garde un seul chemin de sortie, et qu'il soit dans ta bio — nulle part ailleurs.",
    );
  } else {
    constats.push("Aucun renvoi vers une plateforme concurrente.");
  }

  const survente = contient(tout, MOTS_SURVENTE);
  if (survente.length) {
    score -= 15;
    correctifs.push(
      `« ${survente[0]} » appartient au vocabulaire du spam : ça fait baisser la confiance autant que la portée. Remplace l'affirmation par la preuve — montre le tissu au lieu de dire qu'il est le meilleur.`,
    );
  } else {
    constats.push("Pas de survente : le texte reste crédible.");
  }

  if (/\b(image|photo)s? (générée|generee|ia|par ia)\b/i.test(tout)) {
    score -= 20;
    correctifs.push(
      "Un visuel généré par IA est dépriorisé et le public le repère. Pour un produit qu'on achète pour sa matière, filme le vrai tissu.",
    );
  }

  return {
    id: "distribution",
    nom: "Freins de distribution",
    poids: 15,
    score: borner(score),
    role: "Détermine si TikTok accepte de montrer la vidéo, avant même sa qualité.",
    constats,
    correctifs,
  };
}

/** Recherche TikTok : le trafic qui continue de tomber des mois après. */
function analyserSeo(e: EntreeAnalyse): Critere {
  const constats: string[] = [];
  const correctifs: string[] = [];
  let score = 40;

  const tags = e.hashtags.split(/[\s,]+/).filter((t) => t.startsWith("#") && t.length > 1);

  if (tags.length >= 3 && tags.length <= 6) {
    score += 20;
    constats.push(`${tags.length} hashtags — dans la zone idéale (3 à 6).`);
  } else if (tags.length > 6) {
    score -= 8;
    correctifs.push(
      `${tags.length} hashtags, c'est trop : TikTok dilue le classement. Garde les 5 meilleurs.`,
    );
  } else {
    correctifs.push("Mets 3 à 6 hashtags : 1 large, 2 moyens, 2-3 de niche.");
  }

  const aNiche = tags.some((t) => t.length >= 12);
  if (aNiche) {
    score += 15;
    constats.push("Au moins un hashtag de niche — c'est là que tu peux réellement te classer.");
  } else {
    correctifs.push(
      "Ajoute un hashtag long et spécifique (#bazinrichebrodé, #couturesenegalaise). Sur #mode tu es invisible.",
    );
  }

  const legende = e.legende.trim();
  const nbCar = legende.replace(/#\w+/g, "").trim().length;
  if (nbCar >= 40 && nbCar <= 200) {
    score += 15;
    constats.push("Légende de bonne longueur — assez de texte pour être indexée.");
  } else if (nbCar < 40) {
    correctifs.push(
      "Légende trop courte. Écris une phrase complète contenant ce que les gens tapent dans la recherche (« bazin brodé homme prix Dakar »).",
    );
  } else {
    correctifs.push("Légende trop longue : elle est coupée. Va à l'essentiel en 2 lignes.");
  }

  const motsHook = normaliser(e.hook).split(/\s+/).filter((m) => m.length > 4);
  const motsLegende = normaliser(legende);
  const recouvrement = motsHook.filter((m) => motsLegende.includes(m));
  if (recouvrement.length >= 1) {
    score += 12;
    constats.push("Le mot-clé principal est à la fois dit et écrit — TikTok le comprend deux fois.");
  } else {
    correctifs.push(
      "Reprends dans la légende le mot-clé que tu prononces dans l'accroche : TikTok transcrit l'audio et croise les deux.",
    );
  }

  return {
    id: "seo",
    nom: "Découvrabilité (recherche)",
    poids: 6,
    score: borner(score),
    role: "Fait revenir des vues pendant des mois via la recherche TikTok.",
    constats,
    correctifs,
  };
}

/** Format technique. */
function analyserFormat(e: EntreeAnalyse): Critere {
  const constats: string[] = [];
  const correctifs: string[] = [];
  let score = 50;
  const d = e.dureeSec;

  if (d >= 15 && d <= 34) {
    score += 30;
    constats.push(`${d} s — durée idéale : assez long pour convaincre, assez court pour être fini.`);
  } else if (d >= 7 && d < 15) {
    score += 22;
    constats.push(`${d} s — format court : excellent taux de complétion et de replay.`);
  } else if (d > 34 && d <= 60) {
    score += 10;
    constats.push(`${d} s — jouable, mais chaque seconde doit être justifiée.`);
    correctifs.push("Au-delà de 34 s, coupe tout ce qui n'est pas indispensable.");
  } else if (d > 60) {
    score -= 15;
    correctifs.push(
      `${d} s, c'est long : le taux de complétion s'effondre. Découpe en 2 vidéos et fais une série.`,
    );
  } else {
    correctifs.push("Moins de 7 s : pas le temps de vendre. Vise 15 à 30 s.");
  }

  const tout = `${e.script}\n${e.legende}`;
  if (/\b(texte|sous-titre|sous titre|à l'écran|a l'ecran|overlay)\b/i.test(tout)) {
    score += 10;
    constats.push("Texte à l'écran prévu — indispensable, la majorité regarde sans le son.");
  } else {
    correctifs.push("Prévois un texte à l'écran sur chaque plan : beaucoup regardent sans le son.");
  }

  if (/\b(son|musique|audio|trend|tendance)\b/i.test(tout)) {
    score += 10;
    constats.push("Un son est prévu.");
  } else {
    correctifs.push("Choisis un son tendance (moins de 10 000 vidéos) : c'est un accélérateur gratuit.");
  }

  return {
    id: "format",
    nom: "Format technique",
    poids: 4,
    score: borner(score),
    role: "Durée, texte à l'écran, son : les réglages qui multiplient le reste.",
    constats,
    correctifs,
  };
}

/* ────────────────────────────  Analyse globale  ──────────────────────────── */

function estimerVues(score: number): [number, number] {
  if (score < 35) return [100, 1_000];
  if (score < 50) return [500, 4_000];
  if (score < 65) return [2_000, 20_000];
  if (score < 78) return [10_000, 80_000];
  if (score < 88) return [30_000, 250_000];
  return [80_000, 1_000_000];
}

function mentionner(score: number): { mention: string; couleur: string } {
  if (score < 35) return { mention: "À réécrire", couleur: "#f85149" };
  if (score < 50) return { mention: "Faible", couleur: "#e3792e" };
  if (score < 65) return { mention: "Correct", couleur: "#d1a11e" };
  if (score < 78) return { mention: "Bon", couleur: "#3fb950" };
  if (score < 88) return { mention: "Très bon", couleur: "#2ea043" };
  return { mention: "Potentiel viral", couleur: "#39d353" };
}

export function analyser(e: EntreeAnalyse): Analyse {
  const criteres = [
    analyserHook(e),
    analyserRetention(e),
    analyserDistribution(e),
    analyserEmotion(e),
    analyserConversion(e),
    analyserSeo(e),
    analyserFormat(e),
  ];

  const total = criteres.reduce((s, c) => s + c.poids, 0);
  const score = Math.round(
    criteres.reduce((s, c) => s + c.score * c.poids, 0) / total,
  );

  // Le levier prioritaire est le critère qui fait perdre le plus de points pondérés.
  const pire = [...criteres].sort(
    (a, b) => (100 - b.score) * b.poids - (100 - a.score) * a.poids,
  )[0];

  const { mention, couleur } = mentionner(score);

  return {
    score,
    mention,
    couleur,
    criteres,
    vuesEstimees: estimerVues(score),
    levierPrioritaire: pire.correctifs[0] ?? `Continue : « ${pire.nom} » est déjà solide.`,
  };
}
