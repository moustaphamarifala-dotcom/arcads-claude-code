/**
 * Lecture de l'analyse renvoyée par le modèle en mode « score ».
 *
 * Le modèle est censé répondre en JSON pur, mais il l'entoure parfois d'une
 * phrase ou d'un bloc ```json, et il lui arrive d'oublier un champ. Ce module
 * ne fait donc jamais confiance à la forme reçue : il isole le JSON, borne
 * chaque valeur, et rend `null` si rien d'exploitable n'en sort — auquel cas
 * l'appelant retombe sur l'affichage en texte brut.
 */

export type Critere = { nom: string; note: number; commentaire: string };

export type Analyse = {
  note: number;
  verdict: string;
  criteres: Critere[];
  corrections: string[];
  hooks: string[];
};

const borne = (valeur: unknown, max: number): number => {
  const n = Number(valeur);
  return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 0), max) : 0;
};

const listeDeTextes = (valeur: unknown): string[] =>
  Array.isArray(valeur)
    ? valeur.filter((x): x is string => typeof x === "string" && !!x.trim())
    : [];

export function extraireAnalyse(brut: string): Analyse | null {
  const debut = brut.indexOf("{");
  const fin = brut.lastIndexOf("}");
  if (debut === -1 || fin <= debut) return null;

  let donnees: unknown;
  try {
    donnees = JSON.parse(brut.slice(debut, fin + 1));
  } catch {
    return null;
  }

  if (typeof donnees !== "object" || donnees === null) return null;
  const objet = donnees as Record<string, unknown>;

  const criteres: Critere[] = (Array.isArray(objet.criteres) ? objet.criteres : [])
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((critere) => ({
      nom: typeof critere.nom === "string" && critere.nom.trim() ? critere.nom : "Critère",
      note: borne(critere.note, 20),
      commentaire: typeof critere.commentaire === "string" ? critere.commentaire : "",
    }))
    .slice(0, 6);

  if (criteres.length === 0) return null;

  // La note globale annoncée et la somme des critères divergent régulièrement.
  // Les critères sont argumentés un par un, donc c'est leur somme qui fait foi.
  const somme = criteres.reduce((total, c) => total + c.note, 0);

  return {
    note: Math.min(somme, 100),
    verdict: typeof objet.verdict === "string" ? objet.verdict : "",
    criteres,
    corrections: listeDeTextes(objet.corrections).slice(0, 5),
    hooks: listeDeTextes(objet.hooks).slice(0, 5),
  };
}
