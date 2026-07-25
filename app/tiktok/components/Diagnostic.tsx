"use client";

import { useMemo, useState } from "react";
import { diagnostiquer, FREINS } from "../lib/diagnostic";
import styles from "../tiktok.module.css";

export default function Diagnostic() {
  const [abonnes, setAbonnes] = useState(51400);
  const [vues, setVues] = useState(836);
  const [coches, setCoches] = useState<string[]>([]);

  const d = useMemo(
    () => diagnostiquer(abonnes, vues, coches),
    [abonnes, vues, coches],
  );

  const basculer = (id: string) =>
    setCoches((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <div>
      <div className={styles.carte}>
        <div className={styles.carteTitre}>Pourquoi tes vidéos ne sortent pas</div>
        <p className={styles.carteSous}>
          Le chiffre qui compte n&apos;est pas ton nombre de vues, c&apos;est le rapport
          entre tes vues et tes abonnés. S&apos;il est très bas, tu n&apos;as pas un
          problème de contenu : tes vidéos ne sont même plus montrées aux gens qui te
          suivent. Dans ce cas, publier davantage ne sert à rien tant que le blocage
          n&apos;est pas levé.
        </p>

        <div className={styles.grille2}>
          <div className={styles.champ}>
            <label htmlFor="di-abonnes">Nombre d&apos;abonnés</label>
            <input
              id="di-abonnes"
              type="number"
              min={0}
              step={100}
              value={abonnes}
              onChange={(e) => setAbonnes(Math.max(0, Number(e.target.value)))}
            />
          </div>
          <div className={styles.champ}>
            <label htmlFor="di-vues">Vues moyennes de tes 6 dernières vidéos</label>
            <input
              id="di-vues"
              type="number"
              min={0}
              step={10}
              value={vues}
              onChange={(e) => setVues(Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>
      </div>

      <div className={styles.carte}>
        <div
          className={styles.scoreBloc}
          style={{ borderColor: d.couleur, marginBottom: 0 }}
        >
          <div className={styles.scoreChiffre} style={{ color: d.couleur }}>
            {d.tauxPortee.toFixed(1)}
            <span style={{ fontSize: "1.4rem" }}> %</span>
          </div>
          <div className={styles.scoreInfo}>
            <div className={styles.scoreMention} style={{ color: d.couleur }}>
              {d.niveau}
            </div>
            <div className={styles.scoreDetail}>
              Tes vidéos touchent {d.tauxPortee.toFixed(1)} % de tes abonnés.{" "}
              {d.verdict}
            </div>
          </div>
        </div>
      </div>

      {d.tauxPortee < 15 && abonnes > 0 && vues > 0 && (
        <div className={styles.carte}>
          <div className={styles.carteTitre}>Ce que tu perds aujourd&apos;hui</div>
          <p className={styles.carteSous}>
            Un compte de ta taille sans frein majeur tourne autour de 15 à 30 % de portée.
            Ce n&apos;est pas une promesse, c&apos;est un point de comparaison pour
            mesurer l&apos;écart.
          </p>
          <div className={styles.etape}>
            <div>
              <div className={styles.etapeLabel}>Tes vues actuelles</div>
              <div className={styles.etapeDetail}>par vidéo</div>
            </div>
            <div className={styles.etapeValeur}>
              {d.vuesActuelles.toLocaleString("fr-FR")}
            </div>
          </div>
          <div className={styles.etape}>
            <div>
              <div className={styles.etapeLabel}>Un compte comparable sans frein</div>
              <div className={styles.etapeDetail}>
                15 à 30 % de {abonnes.toLocaleString("fr-FR")} abonnés
              </div>
            </div>
            <div className={styles.etapeValeur} style={{ color: "var(--success)" }}>
              {d.vuesComparables[0].toLocaleString("fr-FR")} à{" "}
              {d.vuesComparables[1].toLocaleString("fr-FR")}
            </div>
          </div>
          <div className={styles.total}>
            <div className={styles.totalChiffre}>
              × {d.multiplicateur[0].toFixed(0)} à × {d.multiplicateur[1].toFixed(0)}
            </div>
            <div className={styles.totalLabel}>
              C&apos;est le multiplicateur que tu récupères en levant les freins — sans
              publier une seule vidéo de plus
            </div>
          </div>
        </div>
      )}

      <div className={styles.carte}>
        <div className={styles.carteTitre}>Coche ce qui te correspond</div>
        <p className={styles.carteSous}>
          Sois honnête, personne ne lit tes réponses : elles restent sur ton appareil.
          Chaque case cochée est une cause connue de réduction de distribution.
        </p>

        {FREINS.map((f) => {
          const actif = coches.includes(f.id);
          return (
            <label
              key={f.id}
              className={styles.critere}
              style={{
                display: "block",
                cursor: "pointer",
                borderColor: actif ? "var(--error)" : "var(--border)",
              }}
            >
              <div className={styles.critereEntete}>
                <span className={styles.critereNom}>
                  <input
                    type="checkbox"
                    checked={actif}
                    onChange={() => basculer(f.id)}
                    style={{ marginRight: 10 }}
                  />
                  {f.question}
                </span>
                <span className={styles.criterePoids}>impact {f.poids}</span>
              </div>
              {actif && (
                <>
                  <div className={styles.critereRole} style={{ marginTop: 8 }}>
                    {f.pourquoi}
                  </div>
                  <ul className={styles.liste}>
                    <li className={styles.corriger}>{f.correction}</li>
                  </ul>
                </>
              )}
            </label>
          );
        })}
      </div>

      {d.freinsActifs.length > 0 && (
        <div className={styles.carte}>
          <div className={styles.carteTitre}>Ton plan de déblocage</div>
          <p className={styles.carteSous}>
            {d.freinsActifs.length} frein{d.freinsActifs.length > 1 ? "s" : ""} identifié
            {d.freinsActifs.length > 1 ? "s" : ""}, soit {d.risque} points d&apos;impact
            cumulés. Traite-les dans cet ordre : le premier pèse le plus lourd.
          </p>
          {d.freinsActifs.map((f, i) => (
            <div key={f.id} className={styles.levier}>
              <div>
                <div className={styles.levierNom}>
                  {i + 1}. {f.question}
                </div>
                <div className={styles.levierConseil}>{f.correction}</div>
              </div>
              <div className={styles.levierGain} style={{ color: "var(--accent)" }}>
                {f.poids} pts
              </div>
            </div>
          ))}
          <div className={styles.note}>
            Corrige, puis attends deux semaines avant de juger. La distribution ne
            remonte pas du jour au lendemain : TikTok doit ré-observer ton contenu sur
            plusieurs publications avant de rouvrir les vannes.
          </div>
        </div>
      )}
    </div>
  );
}
