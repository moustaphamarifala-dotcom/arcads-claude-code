/**
 * Simulateur de revenus TikTok — modèle d'entonnoir, pas de promesse.
 *
 * Le calcul est volontairement conservateur et entièrement traçable : chaque
 * franc affiché vient d'une multiplication que l'utilisateur peut vérifier
 * ligne par ligne. Aucun revenu n'est inventé.
 *
 * Note importante sur le Fonds Créateur / Creator Rewards : il n'est PAS
 * disponible au Burkina Faso, au Sénégal, au Mali, en Côte d'Ivoire ni dans la
 * plupart des pays d'Afrique de l'Ouest. Sur ce marché, l'argent vient de la vente de tes
 * produits, des partenariats marques (UGC) et de l'affiliation — pas des vues.
 */

export interface Entrees {
  videosParSemaine: number;
  vuesMoyennes: number;
  tauxVisiteProfil: number;
  tauxContact: number;
  tauxConversion: number;
  panierMoyen: number;
  margeNette: number;
  videosUgcParMois: number;
  tarifUgc: number;
  rachatsParAn: number;
}

export const ENTREES_DEFAUT: Entrees = {
  videosParSemaine: 5,
  vuesMoyennes: 3000,
  tauxVisiteProfil: 2.5,
  tauxContact: 8,
  tauxConversion: 15,
  panierMoyen: 25000,
  margeNette: 40,
  videosUgcParMois: 0,
  tarifUgc: 75000,
  rachatsParAn: 6,
};

export interface Etape {
  label: string;
  valeur: number;
  unite: string;
  detail: string;
}

export interface Levier {
  label: string;
  gain: number;
  conseil: string;
}

export interface Resultat {
  entonnoir: Etape[];
  chiffreAffaires: number;
  margeVentes: number;
  revenuUgc: number;
  total: number;
  parVideo: number;
  valeurClient12Mois: number;
  revenuRegime: number;
  scenarios: { nom: string; total: number; note: string }[];
  leviers: Levier[];
}

const SEMAINES_PAR_MOIS = 4.33;

/** Cœur du modèle : on multiplie les taux, étape par étape. */
function calculerTotal(e: Entrees): {
  vues: number;
  visites: number;
  contacts: number;
  ventes: number;
  ca: number;
  marge: number;
  ugc: number;
  total: number;
} {
  const vues = e.videosParSemaine * SEMAINES_PAR_MOIS * e.vuesMoyennes;
  const visites = vues * (e.tauxVisiteProfil / 100);
  const contacts = visites * (e.tauxContact / 100);
  const ventes = contacts * (e.tauxConversion / 100);
  const ca = ventes * e.panierMoyen;
  const marge = ca * (e.margeNette / 100);
  const ugc = e.videosUgcParMois * e.tarifUgc;
  return { vues, visites, contacts, ventes, ca, marge, ugc, total: marge + ugc };
}

/**
 * Revenu en régime établi : chaque revendeuse gagnée rachète (1 + rachatsParAn)
 * fois sur l'année. Au bout de 12 mois les anciennes rachètent pendant que de
 * nouvelles arrivent — c'est le vrai palier du business, et donc la bonne base
 * pour comparer les leviers.
 */
function totalRegime(e: Entrees): number {
  const b = calculerTotal(e);
  return b.ventes * (1 + e.rachatsParAn) * e.panierMoyen * (e.margeNette / 100) + b.ugc;
}

/** Analyse de sensibilité : +20 % sur un levier, combien ça rapporte en plus ? */
function calculerLeviers(e: Entrees, base: number): Levier[] {
  const variantes: { cle: keyof Entrees; label: string; conseil: string }[] = [
    {
      cle: "vuesMoyennes",
      label: "Vues moyennes par vidéo",
      conseil: "Travaille uniquement l'accroche des 3 premières secondes. C'est le seul levier qui bouge les vues.",
    },
    {
      cle: "videosParSemaine",
      label: "Nombre de vidéos par semaine",
      conseil: "Filme 5 vidéos d'un coup le même jour, publie-les sur la semaine. Le volume bat la perfection.",
    },
    {
      cle: "tauxVisiteProfil",
      label: "Taux de visite du profil",
      conseil: "Dis à voix haute « va voir mon profil » et montre ton nom à l'écran à la fin de chaque vidéo.",
    },
    {
      cle: "tauxContact",
      label: "Taux de prise de contact",
      conseil: "Un seul appel à l'action, très simple : « écris PRIX en commentaire ». Réponds dans l'heure.",
    },
    {
      cle: "tauxConversion",
      label: "Taux de conversion en vente",
      conseil: "Réponds vite, envoie une photo réelle du produit et propose 2 options de prix, pas 10.",
    },
    {
      cle: "panierMoyen",
      label: "Panier moyen",
      conseil: "Propose systématiquement une pièce complémentaire (foulard, retouche, seconde tenue) au moment de la commande.",
    },
    {
      cle: "rachatsParAn",
      label: "Rachats par an d'une même revendeuse",
      conseil: "Écris à chaque revendeuse 3 semaines après sa commande, avant qu'elle ne cherche ailleurs. Garder une cliente coûte dix fois moins cher que d'en trouver une.",
    },
    {
      cle: "margeNette",
      label: "Marge nette",
      conseil: "Négocie le tissu au volume et regroupe tes achats fournisseurs sur un seul déplacement.",
    },
  ];

  return variantes
    .map(({ cle, label, conseil }) => {
      const modifie = { ...e, [cle]: (e[cle] as number) * 1.2 };
      return { label, gain: Math.round(totalRegime(modifie) - base), conseil };
    })
    .sort((a, b) => b.gain - a.gain);
}

export function simuler(e: Entrees): Resultat {
  const b = calculerTotal(e);

  // Scénarios : on dégrade ou améliore les taux de l'entonnoir, pas le volume.
  const facteur = (f: number): Entrees => ({
    ...e,
    tauxVisiteProfil: e.tauxVisiteProfil * f,
    tauxContact: e.tauxContact * f,
    tauxConversion: e.tauxConversion * f,
  });

  const videosMois = Math.round(e.videosParSemaine * SEMAINES_PAR_MOIS);

  return {
    entonnoir: [
      {
        label: "Vues par mois",
        valeur: Math.round(b.vues),
        unite: "vues",
        detail: `${e.videosParSemaine} vidéos/semaine × ${SEMAINES_PAR_MOIS} semaines × ${e.vuesMoyennes.toLocaleString("fr-FR")} vues`,
      },
      {
        label: "Visites de ton profil",
        valeur: Math.round(b.visites),
        unite: "visites",
        detail: `${e.tauxVisiteProfil} % des vues`,
      },
      {
        label: "Personnes qui te contactent",
        valeur: Math.round(b.contacts),
        unite: "contacts",
        detail: `${e.tauxContact} % des visiteurs (commentaire, DM, WhatsApp)`,
      },
      {
        label: "Commandes",
        valeur: Math.round(b.ventes),
        unite: "ventes",
        detail: `${e.tauxConversion} % des contacts`,
      },
    ],
    chiffreAffaires: Math.round(b.ca),
    margeVentes: Math.round(b.marge),
    revenuUgc: Math.round(b.ugc),
    total: Math.round(b.total),
    parVideo: videosMois > 0 ? Math.round(b.total / videosMois) : 0,
    // Une revendeuse gagnée ce mois-ci rachète (1 + rachatsParAn) fois sur l'année.
    valeurClient12Mois: Math.round(
      e.panierMoyen * (1 + e.rachatsParAn) * (e.margeNette / 100),
    ),
    // Régime établi : au bout de 12 mois, les anciennes clientes rachètent
    // pendant que de nouvelles arrivent. C'est le vrai palier, pas le mois 1.
    revenuRegime: Math.round(totalRegime(e)),
    scenarios: [
      {
        nom: "Prudent",
        total: Math.round(calculerTotal(facteur(0.5)).total),
        note: "Tu publies mais tu réponds lentement aux messages.",
      },
      {
        nom: "Réaliste",
        total: Math.round(b.total),
        note: "Tu tiens le rythme et tu réponds le jour même.",
      },
      {
        nom: "Bien exécuté",
        total: Math.round(calculerTotal(facteur(1.8)).total),
        note: "Appel à l'action clair, réponse en moins d'une heure, offre simple.",
      },
    ],
    leviers: calculerLeviers(e, totalRegime(e)),
  };
}

/** Combien de vues par vidéo faut-il pour atteindre un objectif mensuel ? */
export function vuesNecessaires(e: Entrees, objectif: number): number | null {
  const sansVues = { ...e, vuesMoyennes: 1 };
  const parVue = calculerTotal(sansVues).total - e.videosUgcParMois * e.tarifUgc;
  const restant = objectif - e.videosUgcParMois * e.tarifUgc;
  if (parVue <= 0 || restant <= 0) return null;
  return Math.ceil(restant / parVue);
}

export const formatFcfa = (n: number): string =>
  `${Math.round(n).toLocaleString("fr-FR")} F`;
