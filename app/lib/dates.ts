/**
 * Formatage des dates en français, partagé par les modules encyclopédie et presse.
 *
 * Les deux sources n'utilisent pas le même format : Wikidata renvoie
 * « +1991-05-03T00:00:00Z » avec une précision variable, les flux RSS renvoient
 * « Mon, 27 Jul 2026 18:04:00 GMT ». D'où deux fonctions distinctes.
 */

export const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** « Mon, 27 Jul 2026 18:04:00 GMT » → « 27 juillet 2026 ». */
export function formaterDateRss(brute: string | null): string | null {
  if (!brute) return null;
  const d = new Date(brute);
  if (Number.isNaN(d.getTime())) return brute;
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Même entrée, mais réduite au jour (« 2026-07-27 ») pour trier et regrouper. */
export function jourIso(brute: string | null): string | null {
  if (!brute) return null;
  const d = new Date(brute);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** « 2026-07-27 » → « 27 juillet 2026 ». */
export function jourEnFrancais(iso: string): string {
  const [a, m, j] = iso.split("-").map((n) => parseInt(n, 10));
  if (!a || !m || !j) return iso;
  return `${j} ${MOIS[m - 1]} ${a}`;
}

/** Wikidata renvoie « +1991-05-03T00:00:00Z » avec une précision variable. */
export function formaterDateWikidata(valeur: any): string | null {
  const brut: string | undefined = valeur?.time;
  if (!brut) return null;
  const m = /^([+-])(\d{4,})-(\d{2})-(\d{2})/.exec(brut);
  if (!m) return null;

  const avantJC = m[1] === "-";
  const annee = parseInt(m[2], 10);
  const mois = parseInt(m[3], 10);
  const jour = parseInt(m[4], 10);
  const precision: number = valeur.precision ?? 11;
  const suffixe = avantJC ? " av. J.-C." : "";

  if (precision <= 9 || mois === 0) return `${annee}${suffixe}`;
  if (precision === 10 || jour === 0) return `${MOIS[mois - 1]} ${annee}${suffixe}`;
  return `${jour} ${MOIS[mois - 1]} ${annee}${suffixe}`;
}

export function calculerAge(naissance: any, deces: any): number | null {
  const t: string | undefined = naissance?.time;
  if (!t || (naissance?.precision ?? 11) < 11 || t.startsWith("-")) return null;

  const debut = new Date(t.slice(1).replace("Z", "Z"));
  if (Number.isNaN(debut.getTime())) return null;

  const finBrut: string | undefined = deces?.time;
  const fin = finBrut && !finBrut.startsWith("-") ? new Date(finBrut.slice(1)) : new Date();
  if (Number.isNaN(fin.getTime())) return null;

  let age = fin.getFullYear() - debut.getFullYear();
  const moisEcoule = fin.getMonth() - debut.getMonth();
  if (moisEcoule < 0 || (moisEcoule === 0 && fin.getDate() < debut.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}
