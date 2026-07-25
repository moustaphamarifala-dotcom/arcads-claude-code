"use client";

import { useMemo, useState } from "react";
import { composer, VILLES } from "../lib/hashtags";
import type { Profil } from "../lib/profil";
import styles from "../tiktok.module.css";

const LIBELLES: Record<string, string> = {
  large: "Large",
  moyen: "Moyen",
  niche: "Niche",
};

export default function Hashtags({ profil }: { profil: Profil }) {
  const [ville, setVille] = useState(
    VILLES.includes(profil.ville) ? profil.ville : VILLES[0],
  );
  const [motsCles, setMotsCles] = useState(profil.produit);
  const [graine, setGraine] = useState(0);
  const [copie, setCopie] = useState(false);

  const selection = useMemo(
    () =>
      composer(
        ville,
        motsCles.split(/[\s,]+/).filter(Boolean),
        graine,
      ),
    [ville, motsCles, graine],
  );

  async function copier() {
    await navigator.clipboard.writeText(selection.chaine);
    setCopie(true);
    setTimeout(() => setCopie(false), 1500);
  }

  return (
    <div className={styles.carte}>
      <div className={styles.carteTitre}>Hashtags</div>
      <p className={styles.carteSous}>
        L&apos;erreur classique : mettre quinze hashtags énormes. Sur #mode tu es en
        concurrence avec des millions de vidéos et tu n&apos;apparais nulle part. Le
        mélange ci-dessous te fait exister sur les tags où tu peux réellement te classer —
        et c&apos;est là que se trouvent les gens qui achètent.
      </p>

      <div className={styles.grille2}>
        <div className={styles.champ}>
          <label htmlFor="ht-ville">Ta zone</label>
          <select id="ht-ville" value={ville} onChange={(e) => setVille(e.target.value)}>
            {VILLES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className={styles.champ}>
          <label htmlFor="ht-mots">Tes mots-clés produit</label>
          <input
            id="ht-mots"
            type="text"
            value={motsCles}
            placeholder="bazin brodé"
            onChange={(e) => setMotsCles(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tagChaine} style={{ marginTop: 18 }}>
        {selection.chaine}
      </div>

      <div className={styles.barreActions} style={{ marginTop: 0, marginBottom: 18 }}>
        <button className="btn" onClick={copier}>
          {copie ? "Copié" : "Copier"}
        </button>
        <button className="btn btn-secondary" onClick={() => setGraine((g) => g + 1)}>
          Autre combinaison
        </button>
      </div>

      {selection.tags.map((t) => (
        <div key={t.tag} className={styles.tagLigne}>
          <span className={styles.tagNom}>{t.tag}</span>
          <span className={styles.tagTaille}>{LIBELLES[t.taille]}</span>
          <span className={styles.tagNote}>{t.note}</span>
        </div>
      ))}

      <div className={styles.note}>
        {selection.explication} Change de combinaison d&apos;une vidéo à l&apos;autre :
        republier exactement les mêmes tags à chaque fois finit par plafonner ta
        distribution.
      </div>
    </div>
  );
}
