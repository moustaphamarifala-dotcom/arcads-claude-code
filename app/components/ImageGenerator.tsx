"use client";

import { useState } from "react";

const ASPECT_RATIOS = [
  { value: "1:1", label: "Carré (1:1)" },
  { value: "16:9", label: "Paysage (16:9)" },
  { value: "9:16", label: "Portrait / Story (9:16)" },
  { value: "4:3", label: "Classique (4:3)" },
  { value: "3:2", label: "Photo (3:2)" },
];

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);
      if (!data.imageUrl) {
        throw new Error("Aucune image reçue — réessayez dans quelques instants.");
      }
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <div className="field">
        <label htmlFor="image-prompt">Description de l&apos;image</label>
        <textarea
          id="image-prompt"
          placeholder="Ex. : un marché coloré d'Afrique de l'Ouest au coucher du soleil, tissus wax, style photographie professionnelle…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="aspect-ratio">Format</label>
        <select
          id="aspect-ratio"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
        >
          {ASPECT_RATIOS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="actions">
        <button className="btn" onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? "Génération en cours…" : "🎨 Générer l'image"}
        </button>
        {loading && (
          <span className="status">
            <span className="spinner" /> Environ 10 à 30 secondes…
          </span>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      {imageUrl && (
        <div className="result">
          <div className="result-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={prompt} />
          </div>
          <p className="hint">
            <a href={imageUrl} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
              Ouvrir l&apos;image en grand ↗
            </a>
          </p>
        </div>
      )}

      <p className="hint">
        Astuce : décrivez le sujet, le style (photo, illustration, 3D…), l&apos;ambiance
        et les couleurs pour de meilleurs résultats.
      </p>
    </div>
  );
}
