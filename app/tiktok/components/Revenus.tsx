"use client";

import { useMemo, useState } from "react";
import {
  ENTREES_DEFAUT,
  formatFcfa,
  simuler,
  vuesNecessaires,
  type Entrees,
} from "../lib/revenus";
import type { Profil } from "../lib/profil";
import styles from "../tiktok.module.css";

const CHAMPS: { cle: keyof Entrees; label: string; aide: string; pas?: number }[] = [
  {
    cle: "videosParSemaine",
    label: "Vidéos par semaine",
    aide: "En dessous de 4, l'algorithme ne te connaît pas assez.",
  },
  {
    cle: "vuesMoyennes",
    label: "Vues moyennes par vidéo",
    aide: "Prends la moyenne de tes 10 dernières vidéos, pas ton record.",
    pas: 100,
  },
  {
    cle: "tauxVisiteProfil",
    label: "Visites de profil (% des vues)",
    aide: "Visible dans les statistiques TikTok. Entre 1 et 4 % en général.",
    pas: 0.5,
  },
  {
    cle: "tauxContact",
    label: "Prise de contact (% des visiteurs)",
    aide: "Ceux qui commentent, envoient un DM ou cliquent sur WhatsApp.",
    pas: 1,
  },
  {
    cle: "tauxConversion",
    label: "Conversion en vente (% des contacts)",
    aide: "Sur 10 personnes qui t'écrivent, combien commandent vraiment ?",
    pas: 1,
  },
  {
    cle: "panierMoyen",
    label: "Panier moyen (F CFA)",
    aide: "Montant moyen d'une commande, toutes pièces confondues.",
    pas: 1000,
  },
  {
    cle: "margeNette",
    label: "Marge nette (%)",
    aide: "Ce qu'il te reste après le tissu, la façon, le transport et le temps.",
    pas: 5,
  },
  {
    cle: "videosUgcParMois",
    label: "Vidéos payées par des marques / mois",
    aide: "Zéro au début, c'est normal. Ça vient une fois l'audience installée.",
  },
  {
    cle: "tarifUgc",
    label: "Tarif par vidéo de marque (F CFA)",
    aide: "Une marque paie pour ton audience et ton image, pas pour la vidéo.",
    pas: 5000,
  },
];

export default function Revenus({ profil }: { profil: Profil }) {
  const [entrees, setEntrees] = useState<Entrees>(() => ({
    ...ENTREES_DEFAUT,
    panierMoyen: Number(profil.prix) || ENTREES_DEFAUT.panierMoyen,
  }));
  const [objectif, setObjectif] = useState(300000);

  const r = useMemo(() => simuler(entrees), [entrees]);
  const vuesCible = useMemo(
    () => vuesNecessaires(entrees, objectif),
    [entrees, objectif],
  );

  const modifier = (cle: keyof Entrees, valeur: number) =>
    setEntrees((e) => ({ ...e, [cle]: Math.max(0, valeur) }));

  return (
    <div>
      <div className={styles.carte}>
        <div className={styles.carteTitre}>Simulateur de revenus</div>
        <p className={styles.carteSous}>
          Chaque franc affiché vient d&apos;une multiplication que tu peux vérifier ligne
          par ligne. Rien n&apos;est inventé, rien n&apos;est promis. Mets tes vrais
          chiffres : un simulateur optimiste ne t&apos;aide pas à décider.
        </p>

        <div className={styles.profilGrille}>
          {CHAMPS.map((c) => (
            <div key={c.cle} className={styles.champ}>
              <label htmlFor={`rev-${c.cle}`}>{c.label}</label>
              <input
                id={`rev-${c.cle}`}
                type="number"
                min={0}
                step={c.pas ?? 1}
                value={entrees[c.cle]}
                onChange={(e) => modifier(c.cle, Number(e.target.value))}
              />
              <div className={styles.etapeDetail}>{c.aide}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.carte}>
        <div className={styles.carteTitre}>Ton entonnoir, mois par mois</div>
        {r.entonnoir.map((e) => (
          <div key={e.label} className={styles.etape}>
            <div>
              <div className={styles.etapeLabel}>{e.label}</div>
              <div className={styles.etapeDetail}>{e.detail}</div>
            </div>
            <div className={styles.etapeValeur}>
              {e.valeur.toLocaleString("fr-FR")}
            </div>
          </div>
        ))}

        <div className={styles.total}>
          <div className={styles.totalChiffre}>{formatFcfa(r.total)}</div>
          <div className={styles.totalLabel}>
            de revenu net par mois · soit {formatFcfa(r.parVideo)} par vidéo publiée
          </div>
        </div>

        <div className={styles.etape}>
          <div className={styles.etapeLabel}>Chiffre d&apos;affaires</div>
          <div className={styles.etapeValeur}>{formatFcfa(r.chiffreAffaires)}</div>
        </div>
        <div className={styles.etape}>
          <div className={styles.etapeLabel}>Marge sur les ventes</div>
          <div className={styles.etapeValeur}>{formatFcfa(r.margeVentes)}</div>
        </div>
        {r.revenuUgc > 0 && (
          <div className={styles.etape}>
            <div className={styles.etapeLabel}>Vidéos payées par des marques</div>
            <div className={styles.etapeValeur}>{formatFcfa(r.revenuUgc)}</div>
          </div>
        )}
      </div>

      <div className={styles.carte}>
        <div className={styles.carteTitre}>Trois scénarios</div>
        <p className={styles.carteSous}>
          Même volume de publication. Ce qui change, c&apos;est uniquement la qualité de
          ton suivi : rapidité de réponse, clarté de l&apos;offre, simplicité de la
          commande.
        </p>
        <div className={styles.scenarios}>
          {r.scenarios.map((s) => (
            <div key={s.nom} className={styles.scenario}>
              <div className={styles.scenarioNom}>{s.nom}</div>
              <div className={styles.scenarioValeur}>{formatFcfa(s.total)}</div>
              <div className={styles.scenarioNote}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.carte}>
        <div className={styles.carteTitre}>Où mettre ton énergie</div>
        <p className={styles.carteSous}>
          Si tu améliores un seul chiffre de 20 %, voilà ce que ça rapporte en plus chaque
          mois. Commence par le haut de la liste — c&apos;est là que ton effort compte le
          plus.
        </p>
        {r.leviers.map((l) => (
          <div key={l.label} className={styles.levier}>
            <div>
              <div className={styles.levierNom}>{l.label}</div>
              <div className={styles.levierConseil}>{l.conseil}</div>
            </div>
            <div className={styles.levierGain}>+{formatFcfa(l.gain)}</div>
          </div>
        ))}
      </div>

      <div className={styles.carte}>
        <div className={styles.carteTitre}>Ton objectif</div>
        <div className={styles.champ} style={{ maxWidth: 260 }}>
          <label htmlFor="rev-objectif">Revenu net visé par mois (F CFA)</label>
          <input
            id="rev-objectif"
            type="number"
            min={0}
            step={10000}
            value={objectif}
            onChange={(e) => setObjectif(Number(e.target.value) || 0)}
          />
        </div>

        <div className={styles.priorite} style={{ marginTop: 16 }}>
          <span className={styles.prioriteLabel}>Ce qu&apos;il te faut</span>
          {vuesCible === null ? (
            "Avec ces réglages, l'objectif est déjà atteint par tes revenus de partenariats, ou l'un des taux est à zéro."
          ) : (
            <>
              Environ <strong>{vuesCible.toLocaleString("fr-FR")} vues par vidéo</strong>{" "}
              en gardant {entrees.videosParSemaine} vidéos par semaine. Si ce chiffre te
              paraît hors d&apos;atteinte, l&apos;autre chemin est de monter le panier
              moyen ou le taux de conversion — regarde les leviers ci-dessus.
            </>
          )}
        </div>

        <div className={styles.note}>
          Le Fonds Créateur de TikTok (rémunération aux vues) n&apos;existe pas au Burkina
          Faso, au Sénégal, au Mali, en Côte d&apos;Ivoire ni dans la plupart des pays
          d&apos;Afrique de l&apos;Ouest. Ici, l&apos;argent vient de tes ventes, des partenariats avec des
          marques et de l&apos;affiliation — jamais des vues elles-mêmes. C&apos;est
          pourquoi ce simulateur ne compte aucun revenu par vue : les vues ne servent
          qu&apos;à remplir le haut de l&apos;entonnoir.
        </div>
      </div>
    </div>
  );
}
