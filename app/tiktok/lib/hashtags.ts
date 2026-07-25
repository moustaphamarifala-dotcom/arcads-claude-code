/**
 * Moteur de hashtags — stratégie de mélange par taille.
 *
 * Erreur classique : mettre 15 hashtags énormes (#mode, #pourtoi, #viral).
 * Sur ces tags tu es en concurrence avec des millions de vidéos et tu ne te
 * classes nulle part. La stratégie qui marche est un mélange :
 *   1 large (portée)  +  2 moyens (contexte)  +  2-3 niche (classement réel).
 * C'est sur les tags de niche que ta vidéo peut vraiment finir en tête, et
 * c'est là que se trouvent les gens qui achètent.
 */

export type Taille = "large" | "moyen" | "niche";

export interface Tag {
  tag: string;
  taille: Taille;
  note: string;
}

const LARGES: Tag[] = [
  { tag: "#pourtoi", taille: "large", note: "Portée maximale, aucun classement possible. Un seul suffit." },
  { tag: "#mode", taille: "large", note: "Très large. Sert de contexte, pas de trafic." },
  { tag: "#fyp", taille: "large", note: "Équivalent anglophone de #pourtoi." },
];

const MOYENS: Tag[] = [
  { tag: "#bazin", taille: "moyen", note: "Ton tag central : audience déjà intéressée par le tissu." },
  { tag: "#couture", taille: "moyen", note: "Contexte métier, attire aussi d'autres couturiers." },
  { tag: "#modeafricaine", taille: "moyen", note: "Communauté active et acheteuse." },
  { tag: "#tissu", taille: "moyen", note: "Utile pour les vidéos qui montrent la matière." },
  { tag: "#tenuetraditionnelle", taille: "moyen", note: "Fort sur les périodes de fêtes." },
  { tag: "#boubou", taille: "moyen", note: "Recherche directe par nom de vêtement." },
];

const NICHES: Tag[] = [
  { tag: "#bazinriche", taille: "niche", note: "Acheteurs qui connaissent déjà la qualité — les meilleurs clients." },
  { tag: "#bazinbrode", taille: "niche", note: "Très ciblé : broderie, donc panier élevé." },
  { tag: "#coutureafricaine", taille: "niche", note: "Communauté fidèle, bon taux de commentaires." },
  { tag: "#getzner", taille: "niche", note: "Nom de fabricant : audience qui connaît les prix." },
  { tag: "#tailleursurmesure", taille: "niche", note: "Intention d'achat explicite." },
  { tag: "#grandboubou", taille: "niche", note: "Recherche produit très précise." },
  { tag: "#tenuedefete", taille: "niche", note: "À activer avant Tabaski, Korité, mariages." },
  { tag: "#stylistafricain", taille: "niche", note: "Bon pour l'image de marque et les partenariats." },
  { tag: "#faitmain", taille: "niche", note: "Valorise le travail artisanal, justifie le prix." },
  { tag: "#surmesure", taille: "niche", note: "Intention d'achat, faible concurrence." },
];

const GEO: Record<string, Tag[]> = {
  "Burkina Faso": [
    { tag: "#burkinafaso", taille: "moyen", note: "Ton marché entier, plus la diaspora burkinabè qui commande à distance." },
    { tag: "#burkina", taille: "moyen", note: "Forme courte, souvent plus tapée que le nom complet." },
    { tag: "#fasodanfani", taille: "niche", note: "Le tissu tissé national : audience très attachée, forte intention d'achat." },
    { tag: "#bazinburkina", taille: "niche", note: "Croise ton produit et ton marché : quasiment aucune concurrence." },
  ],
  Mali: [
    { tag: "#mali", taille: "moyen", note: "Marché historique du bazin, juste à côté." },
    { tag: "#bamako", taille: "moyen", note: "La capitale concentre les grossistes et les revendeuses." },
    { tag: "#bazinmali", taille: "niche", note: "Audience qui connaît déjà les qualités et les prix." },
  ],
  "Côte d'Ivoire": [
    { tag: "#cotedivoire", taille: "moyen", note: "Gros marché, pouvoir d'achat plus élevé." },
    { tag: "#abidjan", taille: "moyen", note: "La capitale économique de la sous-région." },
    { tag: "#modeivoirienne", taille: "niche", note: "Communauté locale très active sur TikTok." },
  ],
  "Sénégal": [
    { tag: "#senegal", taille: "moyen", note: "Marché mature du bazin brodé." },
    { tag: "#dakar", taille: "moyen", note: "Trafic local sur la capitale." },
    { tag: "#couturesenegalaise", taille: "niche", note: "Communauté fidèle, bon taux de commentaires." },
  ],
  "France (diaspora)": [
    { tag: "#diaspora", taille: "moyen", note: "Commande à distance et paie la livraison sans discuter." },
    { tag: "#paris", taille: "moyen", note: "Panier moyen nettement plus élevé qu'au pays." },
    { tag: "#modeafricaineparis", taille: "niche", note: "Très ciblé, faible concurrence, forte intention d'achat." },
  ],
};

/** Zones de vente proposées. Ce sont des pays : un grossiste ne vend pas dans une seule ville. */
export const ZONES = Object.keys(GEO);
export const VILLES = ZONES;

/** Transforme un mot libre en hashtag propre (sans accents ni espaces). */
export function enTag(mot: string): string {
  const propre = mot
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  return propre ? `#${propre}` : "";
}

export interface Selection {
  tags: Tag[];
  chaine: string;
  explication: string;
}

/**
 * Compose un jeu de 6 hashtags : 1 large, 2 moyens, 3 niche.
 * `graine` fait tourner la sélection d'une vidéo à l'autre — republier
 * exactement les mêmes tags à chaque fois plafonne la distribution.
 */
export function composer(
  ville: string,
  motsCles: string[],
  graine: number,
): Selection {
  const geo = GEO[ville] ?? [];
  const rotation = <T,>(liste: T[], n: number, decalage: number): T[] =>
    liste.length === 0
      ? []
      : Array.from({ length: Math.min(n, liste.length) }, (_, i) => liste[(decalage + i) % liste.length]);

  // Les mots-clés forment UN seul tag : « bazin riche » donne #bazinriche, pas #bazin + #riche.
  const motCle = enTag(motsCles.join(""));
  const perso: Tag[] = motCle.length > 3
    ? [{
        tag: motCle,
        taille: "niche",
        note: "Ton mot-clé : c'est ce que tapent les gens qui cherchent exactement ton produit.",
      }]
    : [];

  const candidats: Tag[] = [
    ...perso,
    ...rotation(LARGES, 1, graine),
    ...rotation(MOYENS, 1, graine),
    ...rotation(geo.filter((t) => t.taille === "moyen"), 1, graine),
    ...rotation(NICHES, perso.length ? 1 : 2, graine),
    ...rotation(geo.filter((t) => t.taille === "niche"), 1, graine),
  ];

  // Un même tag peut venir de deux sources : on ne le garde qu'une fois.
  const vus = new Set<string>();
  const uniques = candidats.filter((t) => !vus.has(t.tag) && vus.add(t.tag) !== undefined);

  const ordre: Record<Taille, number> = { large: 0, moyen: 1, niche: 2 };
  const tags = uniques.slice(0, 6).sort((a, b) => ordre[a.taille] - ordre[b.taille]);

  return {
    tags,
    chaine: tags.map((t) => t.tag).join(" "),
    explication:
      "1 hashtag large pour la portée, 2 moyens pour le contexte, 3 de niche pour te classer réellement. C'est sur les tags de niche que tu es trouvé par des gens qui achètent.",
  };
}
