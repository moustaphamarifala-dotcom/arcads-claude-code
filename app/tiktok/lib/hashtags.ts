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
  Dakar: [
    { tag: "#dakar", taille: "moyen", note: "Trafic local : ceux qui peuvent venir en boutique." },
    { tag: "#senegal", taille: "moyen", note: "Élargit au pays entier." },
    { tag: "#coutureDakar", taille: "niche", note: "Intention locale forte, très peu de concurrence." },
  ],
  Bamako: [
    { tag: "#bamako", taille: "moyen", note: "Trafic local." },
    { tag: "#mali", taille: "moyen", note: "Élargit au pays entier." },
    { tag: "#bazinmali", taille: "niche", note: "Le Mali est un marché historique du bazin." },
  ],
  Abidjan: [
    { tag: "#abidjan", taille: "moyen", note: "Trafic local." },
    { tag: "#cotedivoire", taille: "moyen", note: "Élargit au pays entier." },
    { tag: "#modeivoirienne", taille: "niche", note: "Communauté locale active." },
  ],
  Conakry: [
    { tag: "#conakry", taille: "moyen", note: "Trafic local." },
    { tag: "#guinee", taille: "moyen", note: "Élargit au pays entier." },
    { tag: "#modeguineenne", taille: "niche", note: "Communauté locale active." },
  ],
  Paris: [
    { tag: "#paris", taille: "moyen", note: "Diaspora : panier moyen nettement plus élevé." },
    { tag: "#diaspora", taille: "moyen", note: "Audience qui commande à distance et paie la livraison." },
    { tag: "#modeafricaineparis", taille: "niche", note: "Très ciblé, faible concurrence, forte intention." },
  ],
};

export const VILLES = Object.keys(GEO);

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

  const perso: Tag[] = motsCles
    .map(enTag)
    .filter(Boolean)
    .map((tag) => ({
      tag,
      taille: "niche" as Taille,
      note: "Ton mot-clé : c'est ce que tapent les gens qui cherchent exactement ton produit.",
    }));

  const moyens = [...rotation(MOYENS, 1, graine), ...rotation(geo.filter((t) => t.taille === "moyen"), 1, graine)];
  const niches = [
    ...perso.slice(0, 1),
    ...rotation(NICHES, perso.length ? 1 : 2, graine),
    ...rotation(geo.filter((t) => t.taille === "niche"), 1, graine),
  ];

  const tags = [...rotation(LARGES, 1, graine), ...moyens, ...niches].filter(Boolean).slice(0, 6);

  return {
    tags,
    chaine: tags.map((t) => t.tag).join(" "),
    explication:
      "1 hashtag large pour la portée, 2 moyens pour le contexte, 3 de niche pour te classer réellement. C'est sur les tags de niche que tu es trouvé par des gens qui achètent.",
  };
}
