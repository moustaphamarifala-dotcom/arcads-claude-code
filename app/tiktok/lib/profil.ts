import { ZONES } from "./hashtags";

/** Profil renseigné une seule fois et réutilisé par tous les outils du studio. */
export interface Profil {
  /** Version du format enregistré, pour migrer les réglages obsolètes. */
  v?: number;
  produit: string;
  prix: string;
  ville: string;
  client: string;
}

/**
 * Version du profil enregistré. À incrémenter quand un réglage par défaut
 * change de sens : sans ça, une valeur sauvegardée au premier passage écrase
 * silencieusement le nouveau défaut et l'utilisateur ne voit aucun changement.
 */
const VERSION = 2;

export const PROFIL_DEFAUT: Profil = {
  v: VERSION,
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
    if (!brut) return PROFIL_DEFAUT;

    const sauve = JSON.parse(brut) as Partial<Profil> & { v?: number };
    const profil = { ...PROFIL_DEFAUT, ...sauve, v: VERSION };

    // La zone de vente est passée de la capitale au pays entier : une valeur
    // enregistrée avant ce changement ne doit pas écraser le nouveau défaut.
    if (sauve.v !== VERSION && !ZONES.includes(profil.ville)) {
      profil.ville = PROFIL_DEFAUT.ville;
    }
    return profil;
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
