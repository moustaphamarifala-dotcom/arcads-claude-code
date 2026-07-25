"use client";

import { useEffect, useState } from "react";
import Accroches from "./components/Accroches";
import Diagnostic from "./components/Diagnostic";
import FicheProfil from "./components/FicheProfil";
import Analyseur from "./components/Analyseur";
import Hashtags from "./components/Hashtags";
import PlanContenu from "./components/PlanContenu";
import Revenus from "./components/Revenus";
import Scripts from "./components/Scripts";
import { chargerProfil, enregistrerProfil, PROFIL_DEFAUT, type Profil } from "./lib/profil";
import styles from "./tiktok.module.css";

type Onglet =
  | "diagnostic"
  | "fiche"
  | "plan"
  | "scripts"
  | "accroches"
  | "analyse"
  | "hashtags"
  | "revenus";

const ONGLETS: { id: Onglet; label: string }[] = [
  { id: "diagnostic", label: "🩺 Diagnostic" },
  { id: "fiche", label: "👤 Mon profil" },
  { id: "plan", label: "📅 Plan 30 jours" },
  { id: "scripts", label: "✍️ Scripts" },
  { id: "accroches", label: "🎣 Accroches" },
  { id: "analyse", label: "📊 Analyser" },
  { id: "hashtags", label: "#️⃣ Hashtags" },
  { id: "revenus", label: "💰 Revenus" },
];

export default function StudioTikTok() {
  const [onglet, setOnglet] = useState<Onglet>("diagnostic");
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
          Débloquer la distribution, puis transformer les vues en commandes
        </p>
      </header>

      <p className={styles.intro}>
        Avant de produire plus de contenu, vérifie que le contenu que tu produis déjà
        sort. Beaucoup de comptes n&apos;ont pas un problème de création mais un problème
        de distribution : les vidéos ne sont même plus montrées aux abonnés. Tant que ce
        blocage tient, chaque nouvelle vidéo ira mourir au même niveau que la précédente.
        Commence donc par le <strong>diagnostic</strong>, corrige ton <strong>profil</strong>{" "}
        — c&apos;est là que se décide chaque commande — et seulement ensuite reprends la
        production avec le plan, les scripts et l&apos;analyseur.
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
              placeholder="bazin riche"
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
            <label htmlFor="pr-ville">Où tu vends</label>
            <input
              id="pr-ville"
              type="text"
              value={profil.ville}
              placeholder="Burkina Faso"
              onChange={(e) => modifier("ville", e.target.value)}
            />
          </div>
          <div className={styles.champ}>
            <label htmlFor="pr-client">Comment tu appelles tes clients</label>
            <input
              id="pr-client"
              type="text"
              value={profil.client}
              placeholder="ma revendeuse"
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

      {onglet === "diagnostic" && <Diagnostic />}
      {onglet === "fiche" && <FicheProfil profil={profil} />}
      {onglet === "plan" && <PlanContenu profil={profil} />}
      {onglet === "scripts" && <Scripts profil={profil} />}
      {onglet === "accroches" && <Accroches profil={profil} />}
      {onglet === "analyse" && <Analyseur />}
      {onglet === "hashtags" && <Hashtags profil={profil} />}
      {onglet === "revenus" && <Revenus profil={profil} />}

      <footer className="footer">
        Diagnostic, profil, plan, analyse, hashtags et revenus : tout est calculé sur ton
        appareil, sans clé API et sans que rien ne sorte de ton téléphone. Seuls les
        scripts appellent une IA.
      </footer>
    </main>
  );
}
