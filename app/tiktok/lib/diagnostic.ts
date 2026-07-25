/**
 * Diagnostic de compte — pourquoi tes vidéos ne sortent pas.
 *
 * Beaucoup de comptes n'ont pas un problème de contenu mais un problème de
 * distribution : les vidéos ne sont même plus montrées aux abonnés. Le premier
 * chiffre à regarder n'est donc pas le nombre de vues, mais le rapport entre
 * les vues et les abonnés.
 *
 * Les freins listés ici sont des facteurs largement observés de réduction de
 * distribution sur TikTok. Ce ne sont pas des règles officielles publiées par
 * la plateforme : ce sont des causes constatées, à traiter comme des
 * hypothèses sérieuses, pas comme une vérité gravée.
 */

export interface Frein {
  id: string;
  question: string;
  poids: number;
  pourquoi: string;
  correction: string;
}

/** Les poids totalisent 100 : ils expriment l'impact relatif, pas une probabilité. */
export const FREINS: Frein[] = [
  {
    id: "numero",
    question: "Un numéro de téléphone ou WhatsApp est affiché dans tes vidéos",
    poids: 22,
    pourquoi:
      "TikTok gagne de l'argent quand les gens restent sur TikTok. Un numéro à l'écran envoie l'utilisateur ailleurs, et la distribution est réduite en conséquence.",
    correction:
      "Retire le numéro de l'image. Mets-le dans le lien de ton profil : même information, cliquable, autorisée, et sans coût de distribution.",
  },
  {
    id: "ia",
    question: "Tes visuels sont générés par intelligence artificielle",
    poids: 20,
    pourquoi:
      "Les contenus générés non déclarés sont dépriorisés, et le public réagit mal à ce qu'il identifie comme faux — surtout pour un produit qu'on achète pour sa matière.",
    correction:
      "Filme ton vrai stock. Le tissu qu'on déroule, la main qui passe dessus, le bruit du bazin qu'on froisse. C'est gratuit, et personne ne peut le copier.",
  },
  {
    id: "statique",
    question: "Tes publications sont des images fixes plutôt que de la vidéo filmée",
    poids: 16,
    pourquoi:
      "Une image fixe ne génère ni durée de visionnage ni replay, les deux signaux qui déclenchent la diffusion large.",
    correction:
      "Même dix secondes filmées au téléphone valent mieux qu'une belle image fixe. Le mouvement et le son sont ce qui fait rester.",
  },
  {
    id: "plateforme",
    question: "Tu mets un lien ou un @ d'une autre plateforme dans la vidéo ou la légende",
    poids: 12,
    pourquoi: "Même logique que le numéro : tout ce qui fait sortir de l'application coûte en portée.",
    correction: "Un seul chemin de sortie, et il est dans ta bio. Nulle part ailleurs.",
  },
  {
    id: "vignette",
    question: "Tes vignettes sont couvertes de texte publicitaire",
    poids: 10,
    pourquoi:
      "Une vignette qui ressemble à une publicité fait scroller avant même la première seconde, et TikTok apprend vite que ton contenu ne retient pas.",
    correction:
      "Une ligne de texte maximum sur la vignette, et le produit bien visible derrière. Le reste se dit à l'oral.",
  },
  {
    id: "filigrane",
    question: "Tes vidéos portent le filigrane d'une autre application",
    poids: 8,
    pourquoi: "Un filigrane extérieur signale un contenu importé, ce qui réduit la mise en avant.",
    correction: "Exporte sans filigrane, ou refilme directement dans TikTok.",
  },
  {
    id: "repetition",
    question: "Tu republies souvent le même visuel ou presque",
    poids: 7,
    pourquoi:
      "Les contenus quasi identiques sont regroupés et un seul est distribué. Les autres partent à vide.",
    correction: "Change de décor, d'angle et de tissu à chaque vidéo, même pour dire la même chose.",
  },
  {
    id: "promesses",
    question: "Tes textes contiennent des promesses commerciales très appuyées",
    poids: 5,
    pourquoi:
      "« Meilleur prix », « garanti », « le meilleur du pays » : ce vocabulaire est associé au spam et fait baisser la confiance autant que la portée.",
    correction: "Remplace l'affirmation par la preuve. Montre le tissu au lieu de dire qu'il est le meilleur.",
  },
];

export interface Diagnostic {
  tauxPortee: number;
  niveau: string;
  couleur: string;
  verdict: string;
  risque: number;
  freinsActifs: Frein[];
  vuesActuelles: number;
  vuesComparables: [number, number];
  multiplicateur: [number, number];
}

function evaluerPortee(taux: number): { niveau: string; couleur: string; verdict: string } {
  if (taux < 5) {
    return {
      niveau: "Distribution bloquée",
      couleur: "#f85149",
      verdict:
        "Tes vidéos ne sont même pas montrées à tes propres abonnés. Publier davantage ne changera rien tant que ce blocage n'est pas levé : chaque nouvelle vidéo ira mourir au même niveau.",
    };
  }
  if (taux < 15) {
    return {
      niveau: "Distribution faible",
      couleur: "#e3792e",
      verdict:
        "Tu touches une petite partie de tes abonnés et presque personne en dehors. Il reste des freins à lever avant que le volume de publication serve à quelque chose.",
    };
  }
  if (taux < 40) {
    return {
      niveau: "Distribution normale",
      couleur: "#d1a11e",
      verdict:
        "Tes vidéos sortent correctement auprès de tes abonnés. À ce stade, ce sont l'accroche et la rétention qui décident si tu dépasses ton audience.",
    };
  }
  return {
    niveau: "Bonne distribution",
    couleur: "#3fb950",
    verdict:
      "TikTok te pousse au-delà de tes abonnés. Ton travail maintenant est la conversion : transformer ces vues en messages puis en commandes.",
  };
}

/**
 * Fourchette de portée d'un compte comparable sans frein majeur : 15 à 30 %
 * des abonnés. Ce n'est pas une promesse de résultat, c'est un point de
 * comparaison pour mesurer l'écart.
 */
const PORTEE_SAINE: [number, number] = [15, 30];

export function diagnostiquer(
  abonnes: number,
  vuesMoyennes: number,
  freinsCoches: string[],
): Diagnostic {
  const tauxPortee = abonnes > 0 ? (vuesMoyennes / abonnes) * 100 : 0;
  const { niveau, couleur, verdict } = evaluerPortee(tauxPortee);

  const freinsActifs = FREINS.filter((f) => freinsCoches.includes(f.id)).sort(
    (a, b) => b.poids - a.poids,
  );
  const risque = freinsActifs.reduce((s, f) => s + f.poids, 0);

  const comparables: [number, number] = [
    Math.round((abonnes * PORTEE_SAINE[0]) / 100),
    Math.round((abonnes * PORTEE_SAINE[1]) / 100),
  ];

  return {
    tauxPortee,
    niveau,
    couleur,
    verdict,
    risque,
    freinsActifs,
    vuesActuelles: vuesMoyennes,
    vuesComparables: comparables,
    multiplicateur: [
      vuesMoyennes > 0 ? comparables[0] / vuesMoyennes : 0,
      vuesMoyennes > 0 ? comparables[1] / vuesMoyennes : 0,
    ],
  };
}
