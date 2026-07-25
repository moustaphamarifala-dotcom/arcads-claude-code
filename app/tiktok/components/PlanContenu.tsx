"use client";

import { useMemo, useState } from "react";
import { PILIERS, CRENEAUX } from "../lib/hooks";
import { genererPlan, planEnTexte } from "../lib/plan";
import type { Profil } from "../lib/profil";
import styles from "../tiktok.module.css";

export default function PlanContenu({ profil }: { profil: Profil }) {
  const [rythme, setRythme] = useState(5);
  const [copie, setCopie] = useState(false);

  const jours = useMemo(
    () =>
      genererPlan({
        produit: profil.produit,
        prix: profil.prix ? `${Number(profil.prix).toLocaleString("fr-FR")} F` : "",
        ville: profil.ville,
        client: profil.client,
        videosParSemaine: rythme,
        dateDebut: new Date(),
      }),
    [profil, rythme],
  );

  async function copier() {
    await navigator.clipboard.writeText(planEnTexte(jours, profil.produit));
    setCopie(true);
    setTimeout(() => setCopie(false), 1800);
  }

  return (
    <div>
      <div className={styles.carte}>
        <div className={styles.carteTitre}>Ton plan de 30 jours</div>
        <p className={styles.carteSous}>
          On ne publie pas « ce qui vient ». Quatre piliers tournent dans une proportion
          fixe : publier seulement des offres fait fuir l&apos;audience, publier seulement
          pour les vues ne rapporte rien. La rotation règle les deux problèmes.
        </p>

        <div className={styles.champ} style={{ maxWidth: 260 }}>
          <label htmlFor="pl-rythme">Vidéos par semaine</label>
          <select
            id="pl-rythme"
            value={rythme}
            onChange={(e) => setRythme(Number(e.target.value))}
          >
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n} vidéos {n >= 5 ? "— rythme qui fait décoller" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.barreActions}>
          <button className="btn" onClick={copier}>
            {copie ? "Plan copié" : `Copier le plan (${jours.length} vidéos)`}
          </button>
        </div>

        <div className={styles.note}>
          {PILIERS.map((p) => (
            <div key={p.id} style={{ marginBottom: 6 }}>
              <strong>
                {p.emoji} {p.nom}
              </strong>{" "}
              — {p.objectif}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.carte}>
        <div className={styles.carteTitre}>Les meilleurs créneaux (heure locale)</div>
        <p className={styles.carteSous}>
          Tu publies quand ton audience est disponible, pas quand toi tu as le temps.
        </p>
        {CRENEAUX.map((c) => (
          <div key={c.heure} className={styles.etape}>
            <div>
              <div className={styles.etapeLabel}>{c.heure}</div>
              <div className={styles.etapeDetail}>{c.note}</div>
            </div>
          </div>
        ))}
      </div>

      {jours.map((j) => (
        <div key={j.numero} className={styles.jour}>
          <div className={styles.jourNum}>
            <div className={styles.jourNumChiffre}>{j.numero}</div>
            <div className={styles.jourNumLabel}>vidéo</div>
          </div>
          <div>
            <div className={styles.jourDate}>
              {j.date} · {j.creneau}
            </div>
            <span className={styles.jourPilier}>
              {j.pilier.emoji} {j.pilier.nom}
            </span>
            <div className={styles.jourFormat}>{j.format}</div>
            <div className={styles.jourHook}>« {j.hook} »</div>
            <div className={styles.jourObjectif}>{j.objectif}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
