/**
 * Diagnostic des vues — deuxième partie de l'application qui fonctionne sans IA.
 *
 * Le principe : les statistiques que TikTok donne déjà suffisent à savoir
 * pourquoi une vidéo ne décolle pas, à condition de regarder le bon chiffre.
 * Le bon chiffre n'est pas le nombre de vues, c'est la rétention — la part de
 * la vidéo réellement regardée. C'est elle qui décide si TikTok montre la
 * vidéo à un groupe plus large, et c'est elle qui dit où ça casse : très basse,
 * le problème est l'accroche ; moyenne, c'est le milieu qui décroche.
 *
 * Les seuils ci-dessous sont des repères tirés de l'usage, pas des chiffres
 * officiels de TikTok, qui ne les publie pas. Ils servent à orienter le
 * travail, pas à prédire quoi que ce soit.
 */

export type Niveau = "bon" | "moyen" | "probleme";

export type Constat = {
  niveau: Niveau;
  titre: string;
  texte: string;
};

export type Mesures = {
  dureeVideo: number;
  dureeMoyenne: number;
  vues: number;
  abonnes: number;
  messages: number;
};

export type Resultat = {
  retention: number | null;
  constats: Constat[];
};

function constatRetention(retention: number, dureeVideo: number): Constat {
  if (retention >= 100) {
    return {
      niveau: "bon",
      titre: `Rétention ${Math.round(retention)} % — ta boucle fonctionne`,
      texte:
        "Au-dessus de 100 %, ça veut dire que des gens ont regardé ta vidéo plusieurs fois de suite. C'est le meilleur signal qui existe pour TikTok. Garde exactement cette structure de fin et réutilise-la sur tes prochaines vidéos.",
    };
  }
  if (retention >= 65) {
    return {
      niveau: "bon",
      titre: `Rétention ${Math.round(retention)} % — très bonne`,
      texte:
        "Les gens restent jusqu'au bout. La vidéo est bonne : s'il te manque des vues, le problème est ailleurs — dans la fréquence de publication ou dans le sujet, pas dans le montage.",
    };
  }
  if (retention >= 45) {
    return {
      niveau: "moyen",
      titre: `Rétention ${Math.round(retention)} % — correcte`,
      texte:
        "C'est un niveau honnête, mais il reste de la marge. Cherche le moment précis où la courbe chute dans tes statistiques : c'est presque toujours un temps mort, une phrase de transition ou une explication trop longue. Coupe-le.",
    };
  }
  if (retention >= 25) {
    return {
      niveau: "moyen",
      titre: `Rétention ${Math.round(retention)} % — le milieu décroche`,
      texte:
        "Ton accroche fait son travail puisque les gens entrent, mais ils partent en cours de route. Le problème n'est pas le début : c'est qu'il ne se passe plus rien après. Relance l'attention toutes les trois ou quatre secondes avec un nouveau plan, un nouveau geste ou une nouvelle information.",
    };
  }
  return {
    niveau: "probleme",
    titre: `Rétention ${Math.round(retention)} % — c'est l'accroche`,
    texte:
      dureeVideo > 0
        ? `En moyenne les gens partent avant la ${Math.max(1, Math.round((retention / 100) * dureeVideo))}e seconde. Ils ne voient donc jamais ta marchandise. Tant que ce chiffre ne monte pas, rien d'autre ne sert à rien : c'est la seule chose à travailler.`
        : "Les gens partent presque immédiatement. C'est la seule chose à travailler pour l'instant.",
  };
}

function constatDuree(retention: number, dureeVideo: number): Constat | null {
  if (dureeVideo > 45 && retention < 45) {
    return {
      niveau: "probleme",
      titre: `${Math.round(dureeVideo)} secondes, c'est trop long`,
      texte:
        "À ce niveau de rétention, la durée joue contre toi : TikTok compare ce qui est regardé à ce qui est proposé. La même vidéo en deux fois moins de temps aurait une bien meilleure rétention pour exactement le même contenu. Coupe les salutations, la présentation et tous les silences.",
    };
  }
  if (dureeVideo > 0 && dureeVideo < 8 && retention >= 65) {
    return {
      niveau: "moyen",
      titre: "Très courte, et bien regardée",
      texte:
        "La rétention est bonne, mais une vidéo aussi courte laisse peu de place pour convaincre. Tu peux tenter d'allonger de quelques secondes pour montrer davantage la marchandise : tant que la rétention reste haute, tu gagnes sur les deux tableaux.",
    };
  }
  return null;
}

function constatVues(vues: number, retention: number): Constat {
  if (vues < 300) {
    return retention >= 55
      ? {
          niveau: "moyen",
          titre: `${vues} vues, mais une bonne rétention`,
          texte:
            "C'est la situation la plus frustrante et la plus facile à corriger : ta vidéo est bonne, elle n'a simplement pas encore été montrée à assez de monde. C'est normal sur un compte jeune ou irrégulier. La réponse est la fréquence, pas le montage — publie plusieurs fois par semaine sur le même univers et laisse l'algorithme trouver ton audience.",
        }
      : {
          niveau: "probleme",
          titre: `${vues} vues — la vidéo a été testée et écartée`,
          texte:
            "TikTok montre chaque vidéo à un premier petit groupe. Le tien n'est pas resté, donc la diffusion s'est arrêtée là. Ce n'est pas une punition ni un problème de compte : c'est la rétention. Retravaille l'accroche avant de publier autre chose.",
        };
  }
  if (vues < 3000) {
    return {
      niveau: "moyen",
      titre: `${vues} vues — diffusion normale`,
      texte:
        "Tu es sorti de ton cercle d'abonnés, ce qui est déjà bien. Pour un vendeur, l'important maintenant n'est plus ce chiffre mais la provenance : regarde dans tes statistiques d'où viennent ces vues. Celles qui arrivent d'un pays où tu ne livres pas ne te rapporteront jamais rien.",
    };
  }
  return {
    niveau: "bon",
    titre: `${vues} vues — la vidéo est sortie`,
    texte:
      "L'algorithme t'a poussé largement. Deux réflexes tout de suite : réponds à tous les commentaires pendant que c'est chaud, et republie très vite une vidéo du même genre — c'est le moment où les nouveaux venus décident de te suivre ou non.",
  };
}

function constatAbonnes(abonnes: number, vues: number): Constat | null {
  if (vues < 300) return null;

  const taux = (abonnes / vues) * 100;

  if (abonnes === 0) {
    return {
      niveau: "probleme",
      titre: "Aucun nouvel abonné",
      texte:
        "Les gens ont regardé mais n'ont aucune raison de revenir. C'est ce qui se passe quand une vidéo montre un produit sans jamais montrer la boutique ni la personne qui vend. Donne-leur une raison de te suivre : dis en une phrase ce qu'ils verront la prochaine fois.",
    };
  }
  if (taux < 0.3) {
    return {
      niveau: "moyen",
      titre: `${abonnes} abonnés gagnés — peu par rapport aux vues`,
      texte:
        "Ta vidéo plaît sur le moment mais ne donne pas envie de suivre la suite. C'est typique des vidéos qui présentent une seule pièce : une fois vue, il n'y a plus rien à attendre. Annonce ce qui arrive ensuite, ou fais des séries que les gens veulent suivre.",
    };
  }
  return {
    niveau: "bon",
    titre: `${abonnes} abonnés gagnés`,
    texte:
      "Bon rapport aux vues : cette vidéo ne fait pas que divertir, elle donne envie de te suivre. Note ce qui la différencie de tes autres vidéos et refais-en du même genre.",
  };
}

function constatMessages(messages: number, vues: number): Constat {
  if (messages === 0) {
    return {
      niveau: vues >= 1000 ? "probleme" : "moyen",
      titre: "Aucun message reçu",
      texte:
        vues >= 1000
          ? "C'est le vrai problème de cette vidéo, et il est invisible si tu ne regardes que le compteur de vues. Beaucoup de monde a regardé et personne n'a écrit. Deux causes possibles : soit tu n'as pas dit clairement comment commander, soit ces vues viennent de gens que tu ne peux pas livrer. Vérifie la provenance avant de changer quoi que ce soit."
          : "Trop tôt pour conclure avec ce nombre de vues. Assure-toi simplement que la façon de commander apparaît clairement dans la vidéo, pas seulement dans la légende que peu de gens lisent.",
    };
  }

  const vuesParMessage = Math.round(vues / messages);
  return {
    niveau: "bon",
    titre: `${messages} message${messages > 1 ? "s" : ""} reçu${messages > 1 ? "s" : ""}`,
    texte: `C'est le seul chiffre qui paye, et c'est celui à suivre semaine après semaine. Il te faut environ ${vuesParMessage} vues pour déclencher un message. Garde ce repère : une vidéo à moitié moins de vues mais deux fois plus de messages est une meilleure vidéo, même si le compteur est plus petit.`,
  };
}

export function diagnostiquer(m: Mesures): Resultat {
  if (m.dureeVideo <= 0 || m.dureeMoyenne <= 0) {
    return { retention: null, constats: [] };
  }

  const retention = (m.dureeMoyenne / m.dureeVideo) * 100;

  const constats: (Constat | null)[] = [
    constatRetention(retention, m.dureeVideo),
    constatDuree(retention, m.dureeVideo),
    constatVues(Math.max(0, m.vues), retention),
    constatAbonnes(Math.max(0, m.abonnes), Math.max(0, m.vues)),
    constatMessages(Math.max(0, m.messages), Math.max(0, m.vues)),
  ];

  return {
    retention,
    constats: constats.filter((c): c is Constat => c !== null),
  };
}
