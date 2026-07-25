"use client";

import { useEffect, useState } from "react";
import Accroches from "./components/Accroches";
import Analyseur from "./components/Analyseur";
import Hashtags from "./components/Hashtags";
import PlanContenu from "./components/PlanContenu";
import Revenus from "./components/Revenus";
import Scripts from "./components/Scripts";
import { chargerProfil, enregistrerProfil, PROFIL_DEFAUT, type Profil } from "./lib/profil";
import styles from "./tiktok.module.css";

type Onglet = "plan" | "scripts" | "accroches" | "analyse" | "hashtags" | "revenus";

const ONGLETS: { id: Onglet; label: string }[] = [
  { id: "plan", label: "📅 Plan 30 jours" },
  { id: "scripts", label: "✍️ Scripts" },
  { id: "accroches", label: "🎣 Accroches" },
  { id: "analyse", label: "📊 Analyser" },
  { id: "hashtags", label: "#️⃣ Hashtags" },
  { id: "revenus", label: "💰 Revenus" },
];

export default function StudioTikTok() {
  const [onglet, setOnglet] = useState<Onglet>("plan");
  const [profil, setProfil] = useState<Profil>(PROFIL_DEFAUT);

  // Le profil est relu après le montage : le rendu serveur ne connaît pas localStorage.
  useEffect(() => setProfil(chargerProfil()), []);
  useEffect(() => enregistrerProfil(profil), [profil]);

  const modifier = (cle: keyof Profil, valeur: string) =>
    setProfil((p) => ({ ...p, [cle]: valeur }));

  return (
    <main className="container">
      <a href="/" className={styles.retour}>
        ← Retour au studio
      </a>

      <header className="header">
        <h1>
          Studio <em>TikTok</em>
        </h1>
        <p>
          Transformer des vues en commandes : plan de contenu, scripts, analyse de
          viralité et calcul de revenus
        </p>
      </header>

      <p className={styles.intro}>
        Aucun outil ne fabrique de l&apos;argent tout seul. Celui-ci fait autre chose, et
        c&apos;est plus utile : il t&apos;évite les erreurs qui coûtent des mois de
        travail pour rien — publier sans plan, écrire des accroches qui font scroller,
        oublier de dire comment commander, et croire que les vues rapportent alors
        qu&apos;elles ne servent qu&apos;à amener des gens vers toi. Publie 5 fois par
        semaine pendant 30 jours avec ce plan, et tu sauras exactement où tu en es.
      </p>

      <div className={styles.profil}>
        <div className={styles.profilTitre}>
          Ton produit — renseigné une fois, utilisé par tous les outils
        </div>
        <div className={styles.profilGrille}>
          <div className={styles.champ}>
            <label htmlFor="pr-produit">Ce que tu vends</label>
            <input
              id="pr-produit"
              type="text"
              value={profil.produit}
              placeholder="bazin brodé homme"
              onChange={(e) => modifier("produit", e.target.value)}
            />
          </div>
          <div className={styles.champ}>
            <label htmlFor="pr-prix">Prix moyen (F CFA)</label>
            <input
              id="pr-prix"
              type="number"
              min={0}
              step={1000}
              value={profil.prix}
              onChange={(e) => modifier("prix", e.target.value)}
            />
          </div>
          <div className={styles.champ}>
            <label htmlFor="pr-ville">Ta ville</label>
            <input
              id="pr-ville"
              type="text"
              value={profil.ville}
              placeholder="Dakar"
              onChange={(e) => modifier("ville", e.target.value)}
            />
          </div>
          <div className={styles.champ}>
            <label htmlFor="pr-client">Comment tu appelles tes clients</label>
            <input
              id="pr-client"
              type="text"
              value={profil.client}
              placeholder="ma cliente"
              onChange={(e) => modifier("client", e.target.value)}
            />
          </div>
        </div>
      </div>

      <nav className="tabs" aria-label="Outils du studio TikTok">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            className={`tab ${onglet === o.id ? "active" : ""}`}
            onClick={() => setOnglet(o.id)}
          >
            {o.label}
          </button>
        ))}
      </nav>

      {onglet === "plan" && <PlanContenu profil={profil} />}
      {onglet === "scripts" && <Scripts profil={profil} />}
      {onglet === "accroches" && <Accroches profil={profil} />}
      {onglet === "analyse" && <Analyseur />}
      {onglet === "hashtags" && <Hashtags profil={profil} />}
      {onglet === "revenus" && <Revenus profil={profil} />}

      <footer className="footer">
        Plan, analyse de viralité, hashtags et revenus : calculés sur ton appareil, sans
        clé API. Les scripts utilisent Claude si une clé est configurée, sinon le mode
        gratuit.
      </footer>
    </main>
  );
}
