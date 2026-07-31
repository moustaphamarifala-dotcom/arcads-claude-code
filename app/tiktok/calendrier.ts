/**
 * Calendrier des ventes — la partie de l'application qui ne dépend d'aucune IA.
 *
 * L'idée qui structure tout ce fichier : pour un vendeur de tissu, le pic de
 * commandes ne tombe pas la semaine de la fête, mais plusieurs semaines avant.
 * L'acheteur doit encore trouver un tailleur, et les tailleurs saturent puis
 * refusent les commandes bien avant le jour J. Vendre la semaine de la fête,
 * c'est arriver quand tout est déjà joué.
 *
 * Les dates des fêtes musulmanes suivent le calendrier lunaire : elles avancent
 * d'environ onze jours chaque année et dépendent de l'observation de la lune,
 * donc elles varient d'un pays à l'autre. On ne les code donc nulle part ici :
 * le vendeur saisit sa date, et tout se calcule à partir d'elle.
 */

export type Pic = {
  id: string;
  nom: string;
  quand: string;
  pourquoi: string;
  aFilmer: string[];
};

export const PICS: Pic[] = [
  {
    id: "korite",
    nom: "🌙 Ramadan et Korité",
    quand:
      "Le mois de Ramadan, puis la Korité (Aïd el-Fitr) qui le clôt. Les dates avancent d'environ onze jours chaque année — vérifie-les pour ton pays.",
    pourquoi:
      "C'est la plus grosse saison de l'année pour le tissu : toute la famille s'habille en neuf le jour de la fête, enfants compris. Les commandes se prennent pendant le Ramadan, pas à la fin : dès la deuxième semaine, les tailleurs sont pleins.",
    aFilmer: [
      "Un arrivage complet dès le début du Ramadan, en montrant toute la gamme de couleurs d'un coup.",
      "Une vidéo « combien de mètres pour habiller toute la famille », avec le calcul fait à voix haute.",
      "Le rappel du délai : à partir de quelle date il devient trop tard pour qu'un tailleur ait le temps.",
      "Les couleurs qui partent le plus vite cette année, filmées côte à côte.",
    ],
  },
  {
    id: "tabaski",
    nom: "🐏 Tabaski",
    quand:
      "L'Aïd el-Kébir, environ deux mois et dix jours après la Korité. Là aussi, date lunaire à vérifier localement.",
    pourquoi:
      "Deuxième grosse saison, avec une différence : le budget des familles est partagé entre le mouton et l'habillement. Les acheteurs comparent davantage les prix et décident plus tard, ce qui rend la clarté des prix décisive.",
    aFilmer: [
      "Une gamme par budget : ce qu'on peut avoir à chaque prix, annoncé franchement.",
      "Le complet homme et le complet femme côte à côte, avec le métrage nécessaire pour chacun.",
      "Une vidéo qui répond à « c'est trop cher » sans se justifier : montre ce qui explique le prix.",
      "Ce qu'il te reste en stock à une semaine de la fête, pour les retardataires.",
    ],
  },
  {
    id: "mariages",
    nom: "💍 La saison des mariages",
    quand:
      "Elle se concentre généralement en saison sèche et pendant les vacances, quand la diaspora rentre au pays.",
    pourquoi:
      "Ce sont les plus grosses commandes de l'année : une famille entière s'habille assortie, souvent dans le même tissu. Une seule commande de mariage peut valoir plusieurs semaines de ventes normales, et elle se décide des mois à l'avance.",
    aFilmer: [
      "Un même tissu décliné sur plusieurs personnes, pour montrer le rendu d'une famille assortie.",
      "Ce que tu peux garantir sur une grosse quantité : même bain de teinture, même arrivage.",
      "Une commande de mariage que tu as livrée, du rouleau jusqu'au jour J, si le client est d'accord.",
      "Le délai à respecter pour une commande de groupe, dit clairement.",
    ],
  },
  {
    id: "bapteme",
    nom: "👶 Baptêmes et cérémonies",
    quand: "Toute l'année, sans saison marquée.",
    pourquoi:
      "C'est ton chiffre d'affaires régulier entre les grosses fêtes, celui qui te fait tenir les mois creux. Les commandes sont petites mais fréquentes, et souvent urgentes : un baptême se prépare en une semaine.",
    aFilmer: [
      "Ce qui est disponible tout de suite et livrable dans la journée.",
      "Les tissus qui conviennent à une cérémonie sans être trop habillés.",
      "Une réponse rapide à un message client, filmée en direct, pour montrer ta réactivité.",
    ],
  },
  {
    id: "findannee",
    nom: "🎉 Fêtes de fin d'année",
    quand: "Décembre et le nouvel an.",
    pourquoi:
      "La diaspora rentre et achète beaucoup, souvent pour rapporter du tissu à la famille restée au pays ou en ramener à l'étranger. C'est aussi le moment où l'envoi international se vend le mieux.",
    aFilmer: [
      "Un message clair sur l'envoi à l'étranger : pays desservis, délai, coût.",
      "L'emballage d'un colis pour la diaspora, du pliage jusqu'à l'étiquette.",
      "Ce qui voyage bien : les tissus qui ne se froissent pas ou ne déteignent pas au transport.",
    ],
  },
];

export type Phase = {
  titre: string;
  conseil: string;
  ton: "tot" | "ouverture" | "pic" | "fin" | "passe";
};

/**
 * Traduit un nombre de jours restants en consigne de publication.
 * Le découpage vient du délai de couture : passé un certain point, l'acheteur
 * ne trouve plus de tailleur disponible et n'achète plus de tissu à coudre.
 */
export function phasePour(joursRestants: number): Phase {
  const semaines = joursRestants / 7;

  if (joursRestants < 0) {
    return {
      ton: "passe",
      titre: "La fête est passée",
      conseil:
        "Ne range pas ton téléphone : c'est maintenant que tes clients portent ce qu'ils t'ont acheté. Demande-leur une photo ou une vidéo, republie-les avec leur accord. Ce sont ces preuves qui feront vendre à la prochaine fête, et tu ne pourras plus les obtenir dans un mois.",
    };
  }
  if (semaines < 1) {
    return {
      ton: "fin",
      titre: "Dernière semaine",
      conseil:
        "Les commandes de tissu à coudre sont terminées : plus aucun tailleur ne prend de nouvelle pièce. Arrête de pousser à la vente, tu parlerais dans le vide. Montre plutôt ce qui est prêt à porter ou livrable dans la journée, et occupe-toi des clients déjà servis.",
    };
  }
  if (semaines < 3) {
    return {
      ton: "fin",
      titre: "Ça se termine",
      conseil:
        "Les tailleurs saturent. Dis-le franchement dans tes vidéos : « après telle date, ton tailleur ne pourra plus. » Ce n'est pas une fausse urgence, c'est la vérité, et c'est ce qui fait décider ceux qui hésitent depuis trois semaines.",
    };
  }
  if (semaines < 7) {
    return {
      ton: "pic",
      titre: "Le pic — c'est maintenant",
      conseil:
        "C'est la fenêtre où se prennent la majorité des commandes : l'acheteur a le temps de choisir son tissu et son tailleur a encore de la place. Publie tous les jours si tu peux, montre chaque arrivage, et réponds vite aux messages. Ce que tu ne vends pas maintenant, tu ne le vendras pas.",
    };
  }
  if (semaines < 11) {
    return {
      ton: "ouverture",
      titre: "La saison s'ouvre",
      conseil:
        "Les gens commencent à regarder sans encore commander. C'est le bon moment pour montrer tes arrivages et laisser le temps aux hésitants de te repérer. Ne force pas la vente tout de suite : construis l'envie, les commandes viendront dans quelques semaines.",
    };
  }
  return {
    ton: "tot",
    titre: "Encore loin",
    conseil:
      "Trop tôt pour vendre cette fête : personne n'achète du tissu deux mois et demi à l'avance. Sers-toi de cette période pour te faire connaître, montrer ta boutique et tes clients satisfaits. L'objectif est d'être déjà suivi quand la saison s'ouvrira — un compte créé la veille de la fête n'a aucune chance.",
  };
}

/** Nombre de jours entre aujourd'hui et une date saisie, au jour près. */
export function joursAvant(dateISO: string): number | null {
  const cible = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(cible.getTime())) return null;

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  return Math.round((cible.getTime() - aujourdhui.getTime()) / 86_400_000);
}
