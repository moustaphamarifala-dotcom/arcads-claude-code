/** Profil renseigné une seule fois et réutilisé par tous les outils du studio. */
export interface Profil {
  produit: string;
  prix: string;
  ville: string;
  client: string;
}

export const PROFIL_DEFAUT: Profil = {
  produit: "bazin riche",
  prix: "10000",
  ville: "Burkina Faso",
  client: "ma revendeuse",
};

const CLE = "tiktok.profil";

export function chargerProfil(): Profil {
  if (typeof window === "undefined") return PROFIL_DEFAUT;
  try {
    const brut = window.localStorage.getItem(CLE);
    return brut ? { ...PROFIL_DEFAUT, ...JSON.parse(brut) } : PROFIL_DEFAUT;
  } catch {
    return PROFIL_DEFAUT;
  }
}

export function enregistrerProfil(p: Profil): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(p));
  } catch {
    // Stockage indisponible (navigation privée) : on continue sans sauvegarder.
  }
}
