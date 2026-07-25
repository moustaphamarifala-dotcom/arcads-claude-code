/**
 * Bibliothèque d'accroches et de formats.
 *
 * Les accroches sont des structures, pas des phrases à copier telles quelles :
 * {produit}, {prix}, {ville} et {client} sont remplacés par les données de
 * l'utilisateur. Une structure fonctionne parce qu'elle crée une tension —
 * le contenu qui la remplit doit rester vrai.
 */

export type Categorie =
  | "curiosite"
  | "douleur"
  | "preuve"
  | "contrarian"
  | "argent"
  | "histoire"
  | "liste"
  | "urgence";

export const CATEGORIES: { id: Categorie; label: string; usage: string }[] = [
  { id: "curiosite", label: "Curiosité", usage: "Ouvre une boucle. Idéal pour les vues." },
  { id: "douleur", label: "Problème client", usage: "Parle à quelqu'un qui souffre déjà. Idéal pour les ventes." },
  { id: "preuve", label: "Preuve & résultat", usage: "Montre un résultat réel. Idéal pour la confiance." },
  { id: "contrarian", label: "À contre-courant", usage: "Contredit une croyance. Idéal pour les commentaires." },
  { id: "argent", label: "Prix & argent", usage: "Le sujet le plus commenté. Idéal pour l'engagement." },
  { id: "histoire", label: "Histoire vraie", usage: "Crée l'attachement. Idéal pour les abonnés." },
  { id: "liste", label: "Liste / étapes", usage: "Rétention mécanique. Idéal pour la complétion." },
  { id: "urgence", label: "Urgence & rareté", usage: "Déclenche l'action. Idéal pour les commandes." },
];

export interface ModeleHook {
  texte: string;
  categorie: Categorie;
  pourquoi: string;
}

export const HOOKS: ModeleHook[] = [
  // Curiosité
  { texte: "Ne commande jamais un {produit} sans vérifier ça d'abord.", categorie: "curiosite", pourquoi: "Interdiction + information manquante : le cerveau ne peut pas scroller." },
  { texte: "Personne ne te dira ça sur le {produit}, alors je le dis.", categorie: "curiosite", pourquoi: "Promesse d'information rare + posture de courage." },
  { texte: "Regarde bien la différence à la 8ᵉ seconde.", categorie: "curiosite", pourquoi: "Rendez-vous futur : force à rester jusqu'au repère annoncé." },
  { texte: "Ce détail change tout sur un {produit}, et 9 personnes sur 10 l'ignorent.", categorie: "curiosite", pourquoi: "Chiffre + information cachée + sentiment d'être dans les 10 %." },
  { texte: "J'ai failli jeter ce {produit}. Regarde ce que j'en ai fait.", categorie: "curiosite", pourquoi: "Contraste entre la valeur perçue au début et à la fin." },
  { texte: "Tu vois ce {produit} ? Devine son prix avant la fin.", categorie: "curiosite", pourquoi: "Le jeu de devinette bloque le scroll et remplit les commentaires." },
  { texte: "Il y a une raison pour laquelle ton {produit} ne dure pas 6 mois.", categorie: "curiosite", pourquoi: "Problème vécu + cause cachée annoncée." },
  { texte: "Le truc que les tailleurs ne veulent pas que tu saches.", categorie: "curiosite", pourquoi: "Information gardée secrète par un groupe : irrésistible." },

  // Problème client
  { texte: "Si ton {produit} se froisse au bout de deux heures, voilà pourquoi.", categorie: "douleur", pourquoi: "Décrit un problème précis que la cible vit déjà." },
  { texte: "Toi qui n'oses plus commander en ligne après t'être fait avoir : regarde.", categorie: "douleur", pourquoi: "Adresse directe à une blessure connue." },
  { texte: "Tu as payé {prix} et le résultat ne ressemble pas à la photo ?", categorie: "douleur", pourquoi: "Question qui vise une frustration très répandue." },
  { texte: "Arrête de payer pour un {produit} qui ne te va pas.", categorie: "douleur", pourquoi: "Ordre direct + gaspillage d'argent." },
  { texte: "Le vrai problème, ce n'est pas ton budget. C'est ça.", categorie: "douleur", pourquoi: "Retire l'excuse habituelle, ce qui oblige à écouter la suite." },
  { texte: "Trois clients m'ont dit la même phrase cette semaine.", categorie: "douleur", pourquoi: "Preuve sociale d'un problème partagé." },
  { texte: "Si tu ne sais pas quelle taille commander, cette vidéo est pour toi.", categorie: "douleur", pourquoi: "Ciblage explicite : la bonne personne s'arrête." },
  { texte: "Ce que tu appelles « bazin pas cher » te coûte plus cher à la fin.", categorie: "douleur", pourquoi: "Renverse la logique d'économie du spectateur." },

  // Preuve & résultat
  { texte: "Voilà le même tissu avant et après mon travail.", categorie: "preuve", pourquoi: "Avant/après : format à la meilleure rétention, tous secteurs confondus." },
  { texte: "Ma cliente m'a envoyé ça ce matin. Je n'ai pas pu me retenir.", categorie: "preuve", pourquoi: "Preuve venue du client, pas du vendeur." },
  { texte: "48 heures pour transformer ce tissu en ça.", categorie: "preuve", pourquoi: "Contrainte de temps + transformation visible." },
  { texte: "Elle m'avait dit « je ne pense pas que ça m'ira ». Regarde.", categorie: "preuve", pourquoi: "Objection nommée puis démentie en image." },
  { texte: "Voici les 3 finitions qui font la différence entre un {produit} à {prix} et un vrai.", categorie: "preuve", pourquoi: "Éduque et justifie le prix en même temps." },
  { texte: "J'ai refait cette commande 3 fois. Voilà pourquoi.", categorie: "preuve", pourquoi: "Exigence démontrée par l'effort, pas affirmée." },
  { texte: "Zoom sur la broderie. Tu vas comprendre.", categorie: "preuve", pourquoi: "Invitation à regarder un détail : mécanique de rétention pure." },

  // À contre-courant
  { texte: "Le {produit} le plus cher n'est pas le meilleur. Je t'explique.", categorie: "contrarian", pourquoi: "Contredit une croyance dominante : déclenche le débat." },
  { texte: "Arrête d'acheter du bazin en ligne. Vraiment.", categorie: "contrarian", pourquoi: "Un vendeur qui dit d'arrêter d'acheter : impossible à ignorer." },
  { texte: "Tout le monde te dit de baisser tes prix. C'est une erreur.", categorie: "contrarian", pourquoi: "Prend le contre-pied du conseil habituel." },
  { texte: "Je ne prends plus certaines commandes. Voici pourquoi.", categorie: "contrarian", pourquoi: "Refuser du travail signale de la valeur et intrigue." },
  { texte: "Ce que tout le monde appelle qualité, c'est juste du marketing.", categorie: "contrarian", pourquoi: "Attaque un mot creux : les commentaires se remplissent." },
  { texte: "Non, ce n'est pas trop cher. Et je vais te le prouver.", categorie: "contrarian", pourquoi: "Répond frontalement à l'objection la plus fréquente." },

  // Prix & argent
  { texte: "Voilà ce que coûte vraiment un {produit} à {prix}.", categorie: "argent", pourquoi: "Transparence des coûts : sujet à très fort taux de commentaires." },
  { texte: "Combien je gagne réellement sur cette pièce ?", categorie: "argent", pourquoi: "La curiosité sur les marges est universelle." },
  { texte: "{prix} pour ça. Je détaille chaque franc.", categorie: "argent", pourquoi: "Décomposition du prix : construit la confiance et désamorce l'objection." },
  { texte: "J'ai comparé 3 fournisseurs. L'écart va te surprendre.", categorie: "argent", pourquoi: "Comparaison + promesse de surprise." },
  { texte: "Le même {produit} à {prix} ici, et le double ailleurs.", categorie: "argent", pourquoi: "Ancrage de prix par comparaison directe." },
  { texte: "Avec {prix} tu peux avoir ça. Beaucoup ne le savent pas.", categorie: "argent", pourquoi: "Rend le produit accessible : élargit l'audience acheteuse." },

  // Histoire vraie
  { texte: "J'ai commencé avec un seul mètre de tissu.", categorie: "histoire", pourquoi: "Origine humble : déclenche l'attachement et les abonnements." },
  { texte: "Ma pire commande, c'était il y a deux ans.", categorie: "histoire", pourquoi: "Vulnérabilité assumée : très fort taux de complétion." },
  { texte: "Cette cliente m'a fait pleurer. Dans le bon sens.", categorie: "histoire", pourquoi: "Émotion annoncée dès la première seconde." },
  { texte: "On m'a dit que ça ne marcherait jamais chez nous.", categorie: "histoire", pourquoi: "Doute extérieur + revanche : structure narrative universelle." },
  { texte: "Il y a un an, je n'avais aucun client. Aujourd'hui, regarde.", categorie: "histoire", pourquoi: "Contraste temporel visible en une phrase." },
  { texte: "J'ai perdu de l'argent sur cette commande. Je la referais.", categorie: "histoire", pourquoi: "Paradoxe qui oblige à écouter l'explication." },

  // Liste / étapes
  { texte: "3 erreurs qui ruinent ton {produit}. La 3ᵉ est la pire.", categorie: "liste", pourquoi: "Numérotation + hiérarchie annoncée : rétention jusqu'au bout." },
  { texte: "5 signes que ton tissu n'est pas du vrai bazin.", categorie: "liste", pourquoi: "Liste de vérification : le spectateur s'auto-teste en regardant." },
  { texte: "Comment reconnaître un bon tailleur en 4 questions.", categorie: "liste", pourquoi: "Outil pratique et immédiatement utilisable : très partagé." },
  { texte: "Les 3 étapes que je fais avant chaque coupe.", categorie: "liste", pourquoi: "Coulisses + méthode : éduque et rassure." },
  { texte: "2 choses à vérifier avant de payer un acompte.", categorie: "liste", pourquoi: "Protège le spectateur : déclenche l'enregistrement de la vidéo." },
  { texte: "4 tenues, un seul tissu.", categorie: "liste", pourquoi: "Promesse de variété : le spectateur reste pour voir toutes les options." },

  // Grossiste : parler aux revendeuses
  { texte: "Toi qui revends du bazin et qui galères avec ton fournisseur, regarde.", categorie: "douleur", pourquoi: "Cible une seule personne, qui vit exactement ce problème." },
  { texte: "Combien une revendeuse gagne vraiment sur 3 mètres ?", categorie: "argent", pourquoi: "Montre la marge du client, pas la tienne : c'est ce qui décide un revendeur." },
  { texte: "Voilà la commande d'une seule revendeuse. Elle repart avec tout ça.", categorie: "preuve", pourquoi: "Preuve de volume : rassure sur ta capacité à fournir." },
  { texte: "Acheter moins cher au marché te coûte plus cher à la fin.", categorie: "contrarian", pourquoi: "Renverse le réflexe du prix bas chez un acheteur professionnel." },
  { texte: "Cet arrivage part en 3 jours. Après, j'attends six semaines.", categorie: "urgence", pourquoi: "Rareté crédible parce qu'elle vient d'une contrainte réelle d'approvisionnement." },
  { texte: "3 choses à vérifier avant de choisir ton fournisseur de bazin.", categorie: "liste", pourquoi: "Contenu utile qui te positionne en expert au lieu de vendeur." },
  { texte: "Ce que ton fournisseur ne te montre jamais : l'envers du tissu.", categorie: "curiosite", pourquoi: "Information réservée aux initiés, sur un détail vérifiable." },
  { texte: "Ma première revendeuse a commencé avec 3 mètres.", categorie: "histoire", pourquoi: "Rend le premier pas accessible à celle qui hésite à se lancer." },

  // Urgence & rareté
  { texte: "Il me reste 3 mètres de ce tissu. Après, c'est fini.", categorie: "urgence", pourquoi: "Rareté vérifiable et concrète." },
  { texte: "Ce prix, c'est jusqu'à dimanche. Je ne le referai pas.", categorie: "urgence", pourquoi: "Date limite précise : transforme l'intérêt en action." },
  { texte: "Je ferme les commandes ce soir pour les fêtes.", categorie: "urgence", pourquoi: "Contrainte de production réelle : crédible et efficace." },
  { texte: "Dernière pièce dans cette taille.", categorie: "urgence", pourquoi: "Rareté sur mesure : parle à une seule personne, qui agit." },
  { texte: "Si tu commandes après vendredi, ce ne sera pas prêt à temps.", categorie: "urgence", pourquoi: "Conséquence concrète du retard plutôt que pression commerciale." },
];

/** Piliers de contenu : la rotation qui évite de saturer l'audience. */
export interface Pilier {
  id: string;
  nom: string;
  emoji: string;
  objectif: string;
  part: number;
  formats: string[];
}

export const PILIERS: Pilier[] = [
  {
    id: "attirer",
    nom: "Attirer",
    emoji: "🎯",
    objectif: "Faire des vues auprès de gens qui ne te connaissent pas.",
    part: 4,
    formats: [
      "Déballage d'un arrivage : le carton qu'on ouvre",
      "Le vrai bazin contre l'imitation, en gros plan",
      "Devine le prix de cette pièce",
      "Le bruit du bazin qu'on froisse (son réel, pas de musique)",
      "L'erreur que font 9 revendeuses sur 10",
      "La pile de commande qui se monte, en accéléré",
    ],
  },
  {
    id: "convaincre",
    nom: "Convaincre",
    emoji: "🤝",
    objectif: "Transformer un curieux en personne qui te fait confiance.",
    part: 3,
    formats: [
      "Visite de mon stock, rayon par rayon",
      "Comment je reconnais un bazin grade impérial",
      "Pourquoi ce prix : je décompose le coût",
      "Réponse à l'objection qu'on me fait le plus souvent",
      "Comment j'emballe une commande avant l'envoi",
      "D'où vient mon tissu et pourquoi j'ai choisi ce fournisseur",
    ],
  },
  {
    id: "prouver",
    nom: "Prouver",
    emoji: "⭐",
    objectif: "Montrer qu'on achète déjà chez toi.",
    part: 2,
    formats: [
      "La commande d'une revendeuse, prête à partir",
      "Capture d'un message reçu cette semaine",
      "Une revendeuse qui reçoit son colis",
      "Ce qu'une revendeuse a écoulé en un mois",
      "Les avis reçus depuis lundi",
    ],
  },
  {
    id: "vendre",
    nom: "Vendre",
    emoji: "💰",
    objectif: "Demander la commande, clairement, une seule fois.",
    part: 1,
    formats: [
      "Arrivage du jour : ce qui est disponible maintenant",
      "Stock restant sur cette teinte",
      "Prix revendeuse contre prix détail",
      "Comment commander en 3 étapes",
    ],
  },
];

/**
 * Créneaux de publication — heure locale GMT, valable pour tout le bloc UTC+0 :
 * Burkina Faso, Mali, Sénégal, Côte d'Ivoire, Guinée, Togo.
 * Logique : on publie quand l'audience a du temps libre, pas quand on a le temps.
 */
export const CRENEAUX = [
  { heure: "06 h 30", note: "Réveil / trajet — audience calme, forte complétion." },
  { heure: "12 h 30", note: "Pause déjeuner — pic de scroll de la journée." },
  { heure: "19 h 00", note: "Retour à la maison — bon pour les vidéos longues." },
  { heure: "21 h 30", note: "Meilleur créneau pour vendre : posé, disponible, répond aux DM." },
];

export function remplirHook(
  modele: string,
  vars: { produit: string; prix: string; ville: string; client: string },
): string {
  return modele
    .replace(/\{produit\}/g, vars.produit || "produit")
    .replace(/\{prix\}/g, vars.prix || "ce prix")
    .replace(/\{ville\}/g, vars.ville || "ici")
    .replace(/\{client\}/g, vars.client || "ma cliente");
}
