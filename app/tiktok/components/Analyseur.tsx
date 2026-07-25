"use client";

import { useMemo, useState } from "react";
import { analyser, type EntreeAnalyse } from "../lib/viralite";
import styles from "../tiktok.module.css";

const EXEMPLE: EntreeAnalyse = {
  hook: "Arrête de payer 50 000 F pour un bazin qui se froisse.",
  script: `Plan 1 — je montre le tissu de près
Regarde bien la trame. Tu vois cette brillance ?
Plan 2 — comparaison avec un autre tissu
Mais celui-là, c'est du getzner. Et là, c'est de l'imitation.
Plan 3 — je froisse les deux dans ma main
Sauf que la différence, tu la vois seulement après 2 heures.
Plan 4 — résultat côte à côte, texte à l'écran
Le vrai revient à sa forme. L'autre, non.
Écris VRAI en commentaire, je t'envoie la liste de mes fournisseurs.`,
  legende:
    "Comment reconnaître un vrai bazin riche avant d'acheter — guide rapide pour Ouaga.",
  hashtags: "#pourtoi #bazin #ouaga #bazinriche #getzner #fasodanfani",
  dureeSec: 28,
};

const VIDE: EntreeAnalyse = {
  hook: "",
  script: "",
  legende: "",
  hashtags: "",
  dureeSec: 25,
};

export default function Analyseur() {
  const [entree, setEntree] = useState<EntreeAnalyse>(VIDE);
  const aDuContenu = entree.hook.trim() !== "" || entree.script.trim() !== "";
  const analyse = useMemo(() => analyser(entree), [entree]);

  const modifier = <K extends keyof EntreeAnalyse>(cle: K, valeur: EntreeAnalyse[K]) =>
    setEntree((e) => ({ ...e, [cle]: valeur }));

  return (
    <div>
      <div className={styles.carte}>
        <div className={styles.carteTitre}>Analyse ta vidéo avant de la publier</div>
        <p className={styles.carteSous}>
          Colle ton accroche et ton script. L&apos;analyse est instantanée, elle tourne
          sur ton appareil et ne consomme aucune donnée. Chaque point perdu est expliqué
          avec la correction exacte à faire.
        </p>

        <div className={styles.champ} style={{ marginBottom: 14 }}>
          <label htmlFor="an-hook">Accroche — les 3 premières secondes</label>
          <input
            id="an-hook"
            type="text"
            value={entree.hook}
            placeholder="Arrête de payer 50 000 F pour un bazin qui se froisse."
            onChange={(e) => modifier("hook", e.target.value)}
          />
        </div>

        <div className={styles.champ} style={{ marginBottom: 14 }}>
          <label htmlFor="an-script">Script — une ligne par plan</label>
          <textarea
            id="an-script"
            rows={7}
            value={entree.script}
            placeholder={"Plan 1 — ce qu'on voit, ce qu'on dit\nPlan 2 — …"}
            onChange={(e) => modifier("script", e.target.value)}
          />
        </div>

        <div className={styles.grille2}>
          <div className={styles.champ}>
            <label htmlFor="an-legende">Légende</label>
            <textarea
              id="an-legende"
              rows={3}
              value={entree.legende}
              onChange={(e) => modifier("legende", e.target.value)}
            />
          </div>
          <div className={styles.champ}>
            <label htmlFor="an-tags">Hashtags</label>
            <textarea
              id="an-tags"
              rows={3}
              value={entree.hashtags}
              placeholder="#pourtoi #bazin #dakar"
              onChange={(e) => modifier("hashtags", e.target.value)}
            />
          </div>
        </div>

        <div className={styles.champ} style={{ marginTop: 14, maxWidth: 220 }}>
          <label htmlFor="an-duree">Durée de la vidéo (secondes)</label>
          <input
            id="an-duree"
            type="number"
            min={3}
            max={180}
            value={entree.dureeSec}
            onChange={(e) => modifier("dureeSec", Number(e.target.value) || 0)}
          />
        </div>

        <div className={styles.barreActions}>
          <button className="btn btn-secondary" onClick={() => setEntree(EXEMPLE)}>
            Charger un exemple
          </button>
          <button className="btn btn-secondary" onClick={() => setEntree(VIDE)}>
            Effacer
          </button>
        </div>
      </div>

      {aDuContenu && (
        <div className={styles.carte}>
          <div
            className={styles.scoreBloc}
            style={{ borderColor: analyse.couleur }}
          >
            <div className={styles.scoreChiffre} style={{ color: analyse.couleur }}>
              {analyse.score}
            </div>
            <div className={styles.scoreInfo}>
              <div className={styles.scoreMention} style={{ color: analyse.couleur }}>
                {analyse.mention}
              </div>
              <div className={styles.scoreDetail}>
                Ordre de grandeur des vues pour une vidéo de cette qualité :{" "}
                {analyse.vuesEstimees[0].toLocaleString("fr-FR")} à{" "}
                {analyse.vuesEstimees[1].toLocaleString("fr-FR")}. Ce n&apos;est pas une
                prévision — le résultat dépend aussi de ton compte, de ton audience et du
                son choisi.
              </div>
            </div>
          </div>

          <div className={styles.priorite}>
            <span className={styles.prioriteLabel}>À corriger en premier</span>
            {analyse.levierPrioritaire}
          </div>

          {analyse.criteres.map((c) => (
            <div key={c.id} className={styles.critere}>
              <div className={styles.critereEntete}>
                <span className={styles.critereNom}>{c.nom}</span>
                <span className={styles.criterePoids}>
                  {c.score}/100 · poids {c.poids} %
                </span>
              </div>
              <div className={styles.critereRole}>{c.role}</div>

              <div className={styles.jauge}>
                <div
                  className={styles.jaugeRemplie}
                  style={{
                    width: `${c.score}%`,
                    background: c.score >= 65 ? "var(--success)" : "var(--accent)",
                  }}
                />
              </div>

              {c.constats.length > 0 && (
                <ul className={styles.liste}>
                  {c.constats.map((t, i) => (
                    <li key={i} className={styles.ok}>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              {c.correctifs.length > 0 && (
                <ul className={styles.liste} style={{ marginTop: 8 }}>
                  {c.correctifs.map((t, i) => (
                    <li key={i} className={styles.corriger}>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
