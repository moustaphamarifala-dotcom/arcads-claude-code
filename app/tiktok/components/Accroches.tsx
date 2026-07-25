"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, HOOKS, remplirHook, type Categorie } from "../lib/hooks";
import type { Profil } from "../lib/profil";
import styles from "../tiktok.module.css";

export default function Accroches({ profil }: { profil: Profil }) {
  const [filtre, setFiltre] = useState<Categorie | "toutes">("toutes");
  const [copie, setCopie] = useState<string | null>(null);

  const vars = {
    produit: profil.produit,
    prix: profil.prix ? `${Number(profil.prix).toLocaleString("fr-FR")} F` : "",
    ville: profil.ville,
    client: profil.client,
  };

  const liste = useMemo(
    () => (filtre === "toutes" ? HOOKS : HOOKS.filter((h) => h.categorie === filtre)),
    [filtre],
  );

  const categorieActive = CATEGORIES.find((c) => c.id === filtre);

  async function copier(texte: string) {
    await navigator.clipboard.writeText(texte);
    setCopie(texte);
    setTimeout(() => setCopie(null), 1500);
  }

  return (
    <div className={styles.carte}>
      <div className={styles.carteTitre}>
        {HOOKS.length} accroches, déjà remplies avec ton produit
      </div>
      <p className={styles.carteSous}>
        Ce sont des structures, pas des phrases à recopier bêtement : elles fonctionnent
        parce qu&apos;elles créent une tension. Ce que tu mets dedans doit rester vrai —
        une accroche qui ment fait scroller à la seconde suivante et détruit ta
        crédibilité auprès de gens qui devaient devenir clients.
      </p>

      <div className={styles.filtres}>
        <button
          className={`${styles.filtre} ${filtre === "toutes" ? styles.filtreActif : ""}`}
          onClick={() => setFiltre("toutes")}
        >
          Toutes
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`${styles.filtre} ${filtre === c.id ? styles.filtreActif : ""}`}
            onClick={() => setFiltre(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {categorieActive && (
        <p className={styles.carteSous} style={{ marginTop: -6 }}>
          {categorieActive.usage}
        </p>
      )}

      {liste.map((h, i) => {
        const texte = remplirHook(h.texte, vars);
        return (
          <div key={i} className={styles.hook}>
            <div className={styles.hookTexte}>« {texte} »</div>
            <div className={styles.hookPourquoi}>{h.pourquoi}</div>
            <button className={styles.copier} onClick={() => copier(texte)}>
              {copie === texte ? "Copié" : "Copier"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
