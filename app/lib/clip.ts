/**
 * Logique pure du Studio Clip : découpage d'un script en scènes, easing,
 * effet Ken Burns et retour à la ligne des sous-titres.
 *
 * Tout ce qui touche au canvas ou à MediaRecorder reste dans la page
 * (app/clip/page.tsx) — ce module ne dépend d'aucune API navigateur, ce qui
 * permet de le tester directement avec Node.
 */

export type Scene = {
  texte: string;
  promptImage: string;
};

export const MAX_SCENES = 12;

function nettoyerPrompt(texte: string): string {
  // Une légende de scène fait un bon prompt d'image telle quelle, une fois
  // débarrassée de la ponctuation qui n'apporte rien à la génération.
  return texte.replace(/[«»"']/g, "").replace(/\s+/g, " ").trim();
}

/** Découpe un texte en phrases, sans perdre le signe de ponctuation. */
function decouperPhrases(texte: string): string[] {
  return (texte.match(/[^.!?]+[.!?]*/g) ?? [texte])
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Regroupe des phrases courtes ensemble jusqu'à une longueur cible. */
function regrouper(phrases: string[], longueurCible: number): string[] {
  const groupes: string[] = [];
  let courant = "";

  for (const phrase of phrases) {
    const essai = courant ? `${courant} ${phrase}` : phrase;
    if (courant && essai.length > longueurCible) {
      groupes.push(courant);
      courant = phrase;
    } else {
      courant = essai;
    }
  }
  if (courant) groupes.push(courant);
  return groupes;
}

/**
 * Découpe un script en scènes : un paragraphe (séparé par une ligne vide)
 * devient une scène. S'il n'y a qu'un seul paragraphe, on regroupe ses
 * phrases par blocs d'une longueur raisonnable pour éviter une unique scène
 * interminable. Le résultat est plafonné à MAX_SCENES.
 */
export function decouperScenes(script: string, longueurCible = 90): Scene[] {
  const paragraphes = script
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const blocs =
    paragraphes.length > 1
      ? paragraphes
      : regrouper(decouperPhrases(paragraphes[0] ?? ""), longueurCible);

  return blocs.slice(0, MAX_SCENES).map((texte) => ({
    texte,
    promptImage: nettoyerPrompt(texte),
  }));
}

/* ------------------------------------------------------------------ */
/* Timing                                                              */
/* ------------------------------------------------------------------ */

export function easeInOutCubic(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function formaterDuree(secondes: number): string {
  const s = Math.max(0, Math.round(secondes));
  const m = Math.floor(s / 60);
  const reste = s % 60;
  return `${m}:${String(reste).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Ken Burns                                                           */
/* ------------------------------------------------------------------ */

export type CadreKenBurns = { echelle: number; dx: number; dy: number };

/**
 * Calcule l'échelle et le décalage d'une image en plein cadre à l'instant
 * `progres` (0 à 1) d'un panoramique-zoom lent. `sens` alterne la direction
 * d'une scène à l'autre pour éviter un effet répétitif.
 *
 * `dx`/`dy` sont une fraction (-0.5 à 0.5) du surplus de zoom disponible :
 * c'est à l'appelant (le rendu canvas, en pixels) de les convertir en
 * déplacement réel une fois l'image mise à l'échelle.
 */
export function kenBurns(progres: number, sens: 1 | -1 = 1): CadreKenBurns {
  const t = easeInOutCubic(progres);
  const ECHELLE_DEPART = 1.0;
  const ECHELLE_FIN = 1.12;
  const echelle = ECHELLE_DEPART + (ECHELLE_FIN - ECHELLE_DEPART) * t;

  const dx = sens * t * 0.5;
  const dy = -sens * t * 0.3;

  return { echelle, dx, dy };
}

/* ------------------------------------------------------------------ */
/* Sous-titres                                                         */
/* ------------------------------------------------------------------ */

/**
 * Retourne à la ligne un texte pour qu'aucune ligne ne dépasse `largeurMax`,
 * en s'appuyant sur `mesurer` pour connaître la largeur d'une chaîne — sur un
 * vrai canvas ce sera `ctx.measureText(s).width`, en test une fonction
 * arbitraire suffit.
 */
export function retourALaLigne(
  texte: string,
  largeurMax: number,
  mesurer: (s: string) => number,
): string[] {
  const mots = texte.split(/\s+/).filter(Boolean);
  const lignes: string[] = [];
  let ligne = "";

  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (ligne && mesurer(essai) > largeurMax) {
      lignes.push(ligne);
      ligne = mot;
    } else {
      ligne = essai;
    }
  }
  if (ligne) lignes.push(ligne);
  return lignes;
}
