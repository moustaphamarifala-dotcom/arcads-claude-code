/**
 * Bibliothèque d'accroches — la partie de l'application qui ne dépend
 * d'aucune IA ni d'aucun réseau : ces structures marchent parce qu'elles
 * ouvrent une boucle que le spectateur veut refermer.
 *
 * Chaque modèle contient {sujet}, remplacé par ce que l'utilisateur tape.
 */

export type FamilleAccroches = {
  id: string;
  titre: string;
  pourquoi: string;
  modeles: string[];
};

export const FAMILLES: FamilleAccroches[] = [
  {
    id: "curiosite",
    titre: "🕳️ La curiosité",
    pourquoi:
      "Tu annonces qu'il manque quelque chose au spectateur. Tant qu'il ne l'a pas, il reste. C'est la structure la plus fiable, et la plus vite usée : ne l'utilise que si tu as vraiment une réponse à donner.",
    modeles: [
      "Personne ne te dira ça sur {sujet}, alors je le fais.",
      "J'ai mis deux ans à comprendre ça sur {sujet}. Toi, deux minutes.",
      "Il y a une raison pour laquelle {sujet} ne marche pas chez toi.",
      "Ce que je vais te montrer sur {sujet}, je ne l'ai jamais dit ici.",
      "Regarde bien : c'est le détail que tout le monde rate sur {sujet}.",
    ],
  },
  {
    id: "erreur",
    titre: "🚫 L'erreur",
    pourquoi:
      "Le spectateur a peur de faire partie de ceux qui se trompent. Il reste pour vérifier. Bonus : ça déclenche énormément de commentaires de gens qui se défendent — et le commentaire est le signal qui relance ta vidéo.",
    modeles: [
      "Arrête de faire ça avec {sujet}.",
      "Si tu fais ça avec {sujet}, tu perds ton temps.",
      "3 erreurs sur {sujet} que je vois tous les jours.",
      "Tu ne rates pas {sujet}. Tu t'y prends juste à l'envers.",
      "Ce que tout le monde t'a appris sur {sujet} est faux.",
      "L'erreur numéro 1 sur {sujet}, et je l'ai faite pendant des années.",
    ],
  },
  {
    id: "contradiction",
    titre: "⚡ La contradiction",
    pourquoi:
      "Tu prends le contre-pied d'une idée admise. Le spectateur reste pour te contredire ou pour te donner raison. Attention : ne dis ça que si tu peux vraiment le défendre, sinon tu te fais démonter en commentaire.",
    modeles: [
      "{sujet} ne sert à rien. Voilà pourquoi.",
      "Opinion impopulaire : {sujet} est surestimé.",
      "Tout le monde te dit de faire {sujet}. Moi je te dis l'inverse.",
      "J'ai arrêté {sujet} et ça a été la meilleure décision.",
      "Le conseil le plus donné sur {sujet} est le pire de tous.",
    ],
  },
  {
    id: "resultat",
    titre: "📈 L'avant / après",
    pourquoi:
      "Tu montres le point d'arrivée dès la première seconde. Le spectateur reste pour le chemin. Le résultat doit être visible à l'image, pas juste raconté — sinon l'accroche tombe à plat.",
    modeles: [
      "Voilà ce que ça donne. Je te montre comment j'y suis arrivé avec {sujet}.",
      "30 jours de {sujet}. Le résultat en 20 secondes.",
      "Avant / après sur {sujet} — et je n'ai changé qu'une seule chose.",
      "J'ai testé {sujet} pendant un mois pour que tu n'aies pas à le faire.",
      "Regarde la différence. Tout est parti de {sujet}.",
    ],
  },
  {
    id: "liste",
    titre: "🔢 La liste",
    pourquoi:
      "Le spectateur sait combien de temps ça va durer, donc il accepte de rester. Chaque numéro relance l'attention. Garde-les courtes : trois ou quatre points, pas dix.",
    modeles: [
      "3 choses que j'aurais aimé savoir sur {sujet}.",
      "{sujet} en 4 étapes, sans rien acheter.",
      "Les 3 seules choses qui comptent vraiment dans {sujet}.",
      "Du pire au meilleur : je classe tout ce qui existe en {sujet}.",
      "5 secondes par astuce sur {sujet}. C'est parti.",
    ],
  },
  {
    id: "histoire",
    titre: "💬 L'histoire vraie",
    pourquoi:
      "Une histoire personnelle crée un attachement que l'astuce pure ne crée jamais. C'est ce qui transforme une vue en abonné. Une seule règle : elle doit être vraie.",
    modeles: [
      "Je n'ai jamais raconté ce qui s'est passé avec {sujet}.",
      "Le jour où {sujet} m'a coûté très cher.",
      "On m'a dit que je n'y arriverais jamais avec {sujet}. Voilà où j'en suis.",
      "J'ai failli tout arrêter à cause de {sujet}.",
      "Ça fait des mois que j'hésite à parler de {sujet} ici.",
    ],
  },
  {
    id: "utile",
    titre: "🎁 L'utile immédiat",
    pourquoi:
      "Tu promets quelque chose que le spectateur peut utiliser aujourd'hui. C'est la structure qui génère le plus d'enregistrements et de partages en privé — le signal le plus fort pour l'algorithme.",
    modeles: [
      "Enregistre ça avant de te lancer dans {sujet}.",
      "Garde cette vidéo, tu en auras besoin le jour où tu feras {sujet}.",
      "Tout ce qu'il faut savoir sur {sujet}, en une vidéo.",
      "Envoie ça à quelqu'un qui galère avec {sujet}.",
      "La méthode gratuite que j'utilise pour {sujet}.",
    ],
  },
  {
    id: "question",
    titre: "❓ La question directe",
    pourquoi:
      "Tu t'adresses à une seule personne, pas à une audience. Celui qui se reconnaît reste, les autres passent — et c'est très bien : l'algorithme apprend plus vite à qui te montrer.",
    modeles: [
      "Tu galères avec {sujet} ? Regarde ça.",
      "Pourquoi personne ne parle de ça quand on parle de {sujet} ?",
      "Tu fais partie de ceux qui pensent que {sujet} est compliqué ?",
      "Combien de temps tu perds encore sur {sujet} ?",
      "Sérieusement, qui t'a dit de faire {sujet} comme ça ?",
    ],
  },
];

/** Remplace {sujet} par ce que l'utilisateur a tapé, ou par un repère lisible. */
export function remplir(modele: string, sujet: string): string {
  const valeur = sujet.trim() || "ton sujet";
  return modele.replaceAll("{sujet}", valeur);
}
