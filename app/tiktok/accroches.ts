/**
 * Bibliothèque d'accroches — la partie de l'application qui ne dépend
 * d'aucune IA ni d'aucun réseau : ces structures marchent parce qu'elles
 * ouvrent une boucle que le spectateur veut refermer.
 *
 * Les six premières familles sont propres à la vente : elles ne cherchent pas
 * la vue pour la vue, mais la commande. Les trois dernières servent à se faire
 * connaître de gens qui ne connaissent pas encore la boutique — un compte qui
 * ne fait que vendre finit par ne plus être montré à personne de nouveau.
 *
 * Chaque modèle contient {sujet}, remplacé par ce que l'utilisateur tape.
 */

export type FamilleAccroches = {
  id: string;
  titre: string;
  vendeur: boolean;
  pourquoi: string;
  modeles: string[];
};

export const FAMILLES: FamilleAccroches[] = [
  {
    id: "arrivage",
    titre: "📦 L'arrivage",
    vendeur: true,
    pourquoi:
      "C'est la seule urgence que tu n'as pas besoin d'inventer : la marchandise vient vraiment d'arriver, et elle partira vraiment. Filme le carton ou le rouleau que tu ouvres, pas un stock déjà rangé — l'ouverture est ce qui retient.",
    modeles: [
      "Ça vient d'arriver. Je te montre avant de tout ranger.",
      "J'ouvre le carton avec toi. Je n'ai pas encore vu les couleurs.",
      "Nouvel arrivage de {sujet}. Regarde cette couleur à la lumière.",
      "Ce {sujet} est arrivé ce matin. Il ne fera pas la semaine.",
      "Je n'ai pris que quelques pièces de celui-là. Voilà pourquoi.",
    ],
  },
  {
    id: "prix",
    titre: "💰 Le prix annoncé",
    vendeur: true,
    pourquoi:
      "Annoncer ton prix te fait perdre ceux qui voulaient négocier et gagner tous les autres — et les autres sont bien plus nombreux. « Prix en privé » fait fuir les gens sérieux, qui n'ont pas envie de discuter pour connaître un tarif.",
    modeles: [
      "Le prix est dans la vidéo, pas besoin de m'écrire pour le demander.",
      "Voilà ce que tu as pour ce budget en {sujet}.",
      "Combien coûte un complet de {sujet} ? Je te le dis franchement.",
      "Je te montre trois prix, du moins cher au plus cher.",
      "Ce n'est pas le moins cher du marché. Je t'explique pourquoi.",
    ],
  },
  {
    id: "preuve",
    titre: "✋ La preuve de qualité",
    vendeur: true,
    pourquoi:
      "C'est ta meilleure famille d'accroches, parce qu'elle règle la vraie peur : recevoir autre chose que ce qu'on a vu. Un geste qui prouve la qualité à l'image vaut mieux que dix phrases qui l'affirment.",
    modeles: [
      "Écoute le bruit. C'est ça, la différence.",
      "Regarde ce qui se passe quand je le froisse.",
      "Voilà comment reconnaître un vrai {sujet} en dix secondes.",
      "Deux tissus côte à côte. Devine lequel coûte le double.",
      "Si le tien ne fait pas ça, on t'a vendu autre chose.",
      "Je le teste devant toi, sans coupure.",
    ],
  },
  {
    id: "porte",
    titre: "👗 Le rendu porté",
    vendeur: true,
    pourquoi:
      "Personne n'achète un rouleau, on achète le vêtement qu'on imagine. Tant que ton client doit faire cet effort d'imagination tout seul, il hésite. Montre-le porté et tu supprimes l'hésitation.",
    modeles: [
      "Voilà ce que ça donne une fois cousu.",
      "Le rouleau, puis le résultat. Regarde la différence.",
      "Ma cliente a choisi ce {sujet}. Voilà ce qu'elle en a fait.",
      "Tu hésites sur la couleur ? Regarde-la sur quelqu'un.",
      "Le même {sujet}, sur trois personnes différentes.",
    ],
  },
  {
    id: "confiance",
    titre: "🚚 La confiance",
    vendeur: true,
    pourquoi:
      "Ce qui bloque une commande à distance n'est presque jamais le prix : c'est la peur de ne rien recevoir, ou de recevoir autre chose. Montrer l'emballage, l'envoi et les clients servis débloque plus de ventes que n'importe quelle remise.",
    modeles: [
      "J'emballe la commande d'aujourd'hui avec toi.",
      "Tu es à l'étranger et tu hésites à commander ? Regarde comment ça se passe.",
      "Voilà ce que ma cliente a reçu, et ce qu'elle avait vu dans ma vidéo.",
      "Comment je t'envoie ton {sujet}, étape par étape.",
      "Je réponds au message que tout le monde m'envoie avant de commander.",
    ],
  },
  {
    id: "fete",
    titre: "🎉 L'occasion",
    vendeur: true,
    pourquoi:
      "Le tissu s'achète pour une date. Rappeler la date, et surtout le temps qu'il faut au tailleur, crée une urgence vraie — celle qui fait décider ceux qui hésitent depuis des semaines. Ne l'utilise que quand c'est réellement vrai.",
    modeles: [
      "Si tu attends la semaine de la fête, ton tailleur ne pourra plus.",
      "Il te reste combien de temps avant la fête ? Compte à l'envers avec moi.",
      "Ce que je conseille pour habiller toute la famille sans exploser le budget.",
      "Les couleurs qui partent en premier chaque année. Prends-les maintenant.",
      "Commande maintenant, ton tailleur te dira merci.",
    ],
  },
  {
    id: "erreur",
    titre: "🚫 L'erreur",
    vendeur: false,
    pourquoi:
      "Le spectateur a peur de faire partie de ceux qui se trompent, alors il reste pour vérifier. Ça déclenche beaucoup de commentaires de gens qui se défendent — et le commentaire est le signal qui relance ta vidéo auprès de nouvelles personnes.",
    modeles: [
      "Arrête d'acheter ton {sujet} comme ça.",
      "3 erreurs que je vois tous les jours chez mes clients.",
      "Si on t'a vendu ça à ce prix, tu t'es fait avoir.",
      "Ce que tout le monde croit sur {sujet} est faux.",
      "L'erreur que j'ai faite pendant des années avant d'ouvrir ma boutique.",
    ],
  },
  {
    id: "utile",
    titre: "🎁 Le conseil utile",
    vendeur: false,
    pourquoi:
      "C'est ce qui te fait découvrir par des gens qui ne cherchaient pas à acheter aujourd'hui. Ils enregistrent, ils te suivent, et ils reviennent au moment de la fête. Sans ces vidéos-là, tu ne parles qu'à ceux qui te connaissent déjà.",
    modeles: [
      "Comment entretenir ton {sujet} pour qu'il tienne des années.",
      "Enregistre ça avant d'acheter ton prochain {sujet}.",
      "Combien de mètres il te faut vraiment, selon ta taille.",
      "Envoie ça à quelqu'un qui va bientôt acheter du {sujet}.",
      "Ce qu'il faut demander à ton tailleur pour ne pas gâcher ton tissu.",
    ],
  },
  {
    id: "histoire",
    titre: "💬 L'histoire vraie",
    vendeur: false,
    pourquoi:
      "Une histoire personnelle crée un attachement qu'un argument de vente ne crée jamais : c'est ce qui transforme un spectateur en client fidèle. Une seule règle, et elle n'est pas négociable : elle doit être vraie.",
    modeles: [
      "Le jour où j'ai perdu une commande entière à cause de ça.",
      "Comment j'ai commencé à vendre du {sujet}, sans rien connaître.",
      "Ma pire cliente m'a appris la chose la plus utile.",
      "On m'a dit que je n'y arriverais jamais. Voilà où j'en suis.",
      "Je n'ai jamais raconté ce qui s'est passé à mon premier arrivage.",
    ],
  },
];

/** Remplace {sujet} par ce que l'utilisateur a tapé, ou par un repère lisible. */
export function remplir(modele: string, sujet: string): string {
  const valeur = sujet.trim() || "ton produit";
  return modele.replaceAll("{sujet}", valeur);
}
