"use client";

import { useState } from "react";
import TextGenerator from "./components/TextGenerator";
import ImageGenerator from "./components/ImageGenerator";
import VideoGenerator from "./components/VideoGenerator";

type Tab = "texte" | "image" | "video";

const TABS: { id: Tab; label: string }[] = [
  { id: "texte", label: "✍️ Textes" },
  { id: "image", label: "🎨 Images" },
  { id: "video", label: "🎬 Vidéos" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("texte");

  return (
    <main className="container">
      <header className="header">
        <h1>
          Studio de <em>Génération de Contenu</em>
        </h1>
        <p>Créez des textes, images et vidéos grâce à l&apos;intelligence artificielle</p>
      </header>

      <nav className="tabs" aria-label="Type de contenu">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "texte" && <TextGenerator />}
      {tab === "image" && <ImageGenerator />}
      {tab === "video" && <VideoGenerator />}

      <p style={{ textAlign: "center", marginTop: 28 }}>
        <a
          href="/photo"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 999,
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          📷 Ouvrir le Studio Photo ultra-réaliste →
        </a>
      </p>

      <footer className="footer">
        Mode gratuit : textes et images sans clé API (Pollinations.ai) · Avec clés
        API : Claude (textes), FLUX (images), WAN (vidéos)
      </footer>
    </main>
  );
}
