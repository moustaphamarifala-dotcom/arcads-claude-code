"use client";

import { useRef, useState } from "react";

const CONTENT_TYPES = [
  "Article de blog",
  "Publication réseaux sociaux",
  "Texte publicitaire",
  "Script vidéo",
  "Email marketing",
  "Description de produit",
  "Communiqué de presse",
];

const TONES = [
  "Professionnel",
  "Amical",
  "Persuasif",
  "Inspirant",
  "Humoristique",
  "Informatif",
];

export default function TextGenerator() {
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setOutput("");
    setCopied(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, contentType, tone }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Erreur serveur (${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="panel">
      <div className="row">
        <div className="field">
          <label htmlFor="content-type">Type de contenu</label>
          <select
            id="content-type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="tone">Ton</label>
          <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
            {TONES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="text-prompt">Votre demande</label>
        <textarea
          id="text-prompt"
          placeholder="Ex. : un article sur les bienfaits du commerce local à Dakar, environ 500 mots…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="actions">
        <button className="btn" onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? "Génération en cours…" : "✍️ Générer le texte"}
        </button>
        {loading && (
          <button className="btn btn-secondary" onClick={stop}>
            Arrêter
          </button>
        )}
        {output && !loading && (
          <button className="btn btn-secondary" onClick={copy}>
            {copied ? "✓ Copié" : "Copier"}
          </button>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      {output && (
        <div className="result">
          <div className="result-text">{output}</div>
        </div>
      )}
    </div>
  );
}
