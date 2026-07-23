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

      <footer className="footer">
        Textes générés par Claude (Anthropic) · Images par FLUX · Vidéos par WAN
      </footer>
    </main>
  );
}
