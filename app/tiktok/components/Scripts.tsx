"use client";

import { useState } from "react";
import type { Profil } from "../lib/profil";
import styles from "../tiktok.module.css";

const ANGLES = [
  "Avant / après sur le tissu",
  "Devine le prix",
  "3 erreurs que font les clients",
  "Coulisses de l'atelier",
  "Pourquoi ce prix : je décompose",
  "Le vrai contre le faux",
  "Témoignage d'une cliente",
  "Offre de la semaine",
];

const OBJECTIFS = [
  "Faire des vues auprès de gens qui ne me connaissent pas",
  "Donner envie de me faire confiance",
  "Recevoir des messages WhatsApp",
  "Vendre une pièce précise cette semaine",
];

export default function Scripts({ profil }: { profil: Profil }) {
  const [angle, setAngle] = useState(ANGLES[0]);
  const [objectif, setObjectif] = useState(OBJECTIFS[0]);
  const [duree, setDuree] = useState(25);
  const [details, setDetails] = useState("");
  const [sortie, setSortie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  async function generer() {
    setEnCours(true);
    setErreur("");
    setSortie("");

    try {
      const res = await fetch("/api/tiktok-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produit: profil.produit,
          prix: profil.prix,
          ville: profil.ville,
          angle,
          duree,
          objectif,
          details,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "La génération a échoué. Réessayez.");
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setSortie(await res.text());
        return;
      }

      const decodeur = new TextDecoder();
      let texte = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        texte += decodeur.decode(value, { stream: true });
        setSortie(texte);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <div className={styles.carte}>
        <div className={styles.carteTitre}>Générateur de scripts</div>
        <p className={styles.carteSous}>
          L&apos;IA écrit 3 accroches au choix, le script plan par plan avec les
          timecodes, le texte à afficher à l&apos;écran, l&apos;appel à l&apos;action, la
          légende et les hashtags. Tu n&apos;as plus qu&apos;à filmer.
        </p>

        <div className={styles.grille2}>
          <div className={styles.champ}>
            <label htmlFor="sc-angle">Angle de la vidéo</label>
            <select id="sc-angle" value={angle} onChange={(e) => setAngle(e.target.value)}>
              {ANGLES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className={styles.champ}>
            <label htmlFor="sc-objectif">Objectif</label>
            <select
              id="sc-objectif"
              value={objectif}
              onChange={(e) => setObjectif(e.target.value)}
            >
              {OBJECTIFS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.champ} style={{ marginTop: 14, maxWidth: 220 }}>
          <label htmlFor="sc-duree">Durée cible (secondes)</label>
          <input
            id="sc-duree"
            type="number"
            min={7}
            max={90}
            value={duree}
            onChange={(e) => setDuree(Number(e.target.value) || 25)}
          />
        </div>

        <div className={styles.champ} style={{ marginTop: 14 }}>
          <label htmlFor="sc-details">
            Ce que l&apos;IA doit savoir sur toi (facultatif mais ça change tout)
          </label>
          <textarea
            id="sc-details"
            rows={3}
            value={details}
            placeholder="Je couds moi-même, délai 5 jours, je livre à Dakar et j'envoie en France. Mon tissu vient de chez un grossiste à Sandaga."
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>

        <div className={styles.barreActions}>
          <button className="btn" onClick={generer} disabled={enCours}>
            {enCours ? "Écriture en cours…" : "Écrire le script"}
          </button>
          {enCours && <span className="spinner" />}
          {sortie && !enCours && (
            <button
              className="btn btn-secondary"
              onClick={() => navigator.clipboard.writeText(sortie)}
            >
              Copier
            </button>
          )}
        </div>

        {erreur && <div className="error-box">{erreur}</div>}
      </div>

      {sortie && <div className={styles.sortie}>{sortie}</div>}
    </div>
  );
}
