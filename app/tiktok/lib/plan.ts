/**
 * Générateur de plan de contenu 30 jours.
 *
 * Principe : on ne publie pas « ce qui vient », on fait tourner 4 piliers dans
 * une proportion fixe (4 attirer / 3 convaincre / 2 prouver / 1 vendre).
 * Publier uniquement pour vendre fait fuir l'audience ; publier uniquement
 * pour faire des vues ne rapporte rien. La rotation résout les deux.
 */

import { PILIERS, HOOKS, CRENEAUX, remplirHook, type Pilier } from "./hooks";

export interface Jour {
  numero: number;
  date: string;
  pilier: Pilier;
  format: string;
  hook: string;
  creneau: string;
  noteCreneau: string;
  objectif: string;
}

export interface OptionsPlan {
  produit: string;
  prix: string;
  ville: string;
  client: string;
  videosParSemaine: number;
  dateDebut: Date;
}

/** Séquence pondérée : 4 attirer, 3 convaincre, 2 prouver, 1 vendre, mélangée pour éviter les blocs. */
const SEQUENCE = ["attirer", "convaincre", "attirer", "prouver", "attirer", "convaincre", "vendre", "attirer", "prouver", "convaincre"];

const OBJECTIFS: Record<string, string> = {
  attirer: "Objectif : des vues de gens qui ne te connaissent pas. Ne vends pas dans cette vidéo.",
  convaincre: "Objectif : donner envie de te faire confiance. Montre le travail, pas le produit fini seulement.",
  prouver: "Objectif : montrer qu'on achète déjà chez toi. Un client réel vaut dix arguments.",
  vendre: "Objectif : demander la commande, clairement, une seule fois.",
};

function formaterDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function genererPlan(o: OptionsPlan): Jour[] {
  const vars = { produit: o.produit, prix: o.prix, ville: o.ville, client: o.client };
  const jours: Jour[] = [];

  // Répartition des jours de publication sur 30 jours selon le rythme choisi.
  const intervalle = 7 / Math.max(1, Math.min(7, o.videosParSemaine));
  const total = Math.floor(30 / intervalle);

  for (let i = 0; i < total; i++) {
    const date = new Date(o.dateDebut);
    date.setDate(date.getDate() + Math.round(i * intervalle));

    const idPilier = SEQUENCE[i % SEQUENCE.length];
    const pilier = PILIERS.find((p) => p.id === idPilier) ?? PILIERS[0];

    const format = pilier.formats[i % pilier.formats.length];

    // On aligne la catégorie d'accroche sur l'intention du pilier.
    const categories: Record<string, string[]> = {
      attirer: ["curiosite", "contrarian", "liste"],
      convaincre: ["douleur", "argent", "liste"],
      prouver: ["preuve", "histoire"],
      vendre: ["urgence", "argent"],
    };
    const cibles = categories[idPilier] ?? ["curiosite"];
    const candidats = HOOKS.filter((h) => cibles.includes(h.categorie));
    const modele = candidats[i % candidats.length];

    // Les vidéos qui vendent partent le soir, quand les gens peuvent répondre.
    const creneau = idPilier === "vendre" ? CRENEAUX[3] : CRENEAUX[i % 3];

    jours.push({
      numero: i + 1,
      date: formaterDate(date),
      pilier,
      format,
      hook: remplirHook(modele.texte, vars),
      creneau: creneau.heure,
      noteCreneau: creneau.note,
      objectif: OBJECTIFS[idPilier],
    });
  }

  return jours;
}

/** Export texte : imprimable, ou collable dans WhatsApp / un carnet. */
export function planEnTexte(jours: Jour[], produit: string): string {
  const lignes = [
    `PLAN DE CONTENU TIKTOK — 30 JOURS — ${produit.toUpperCase()}`,
    `${jours.length} vidéos à publier`,
    "",
  ];

  for (const j of jours) {
    lignes.push(
      `── Vidéo ${j.numero} — ${j.date} — ${j.creneau}`,
      `   Pilier  : ${j.pilier.emoji} ${j.pilier.nom}`,
      `   Format  : ${j.format}`,
      `   Accroche: « ${j.hook} »`,
      `   ${j.objectif}`,
      "",
    );
  }

  lignes.push(
    "RÈGLE : ne saute pas les vidéos « Attirer » pour publier plus d'offres.",
    "Sans nouvelles vues, il n'y a personne à qui vendre.",
  );

  return lignes.join("\n");
}
