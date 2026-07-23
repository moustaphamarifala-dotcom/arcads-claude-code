"use client";

import { useRef, useState } from "react";
import styles from "./couture.module.css";

const EXAMPLES = [
  "Fais porter ce tissu bazin à une femme élégante, robe de couture moderne et tendance, pose de mannequin, fond studio",
  "Crée un boubou masculin chic avec ce bazin, broderies au col, style tendance, homme mannequin",
  "Transforme ce tissu en ensemble deux pièces féminin moderne, coupe couture, défilé de mode",
  "Utilise ce motif pour un tailleur élégant, style africain contemporain, photo de mode professionnelle",
];

// Réduit une image (max 1024px) pour un envoi rapide et léger
function fileToResizedDataURL(file: File, max = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > max || height > max) {
          if (width >= height) {
            height = Math.round((height * max) / width);
            width = max;
          } else {
            width = Math.round((width * max) / height);
            height = max;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CoutureStudio() {
  const [refs, setRefs] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError(null);
    try {
      const dataUrls = await Promise.all(files.slice(0, 3).map((f) => fileToResizedDataURL(f)));
      setRefs((prev) => [...prev, ...dataUrls].slice(0, 3));
    } catch {
      setError("Impossible de lire cette image. Essaie une autre photo.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeRef(i: number) {
    setRefs((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function generate() {
    if (!prompt.trim() || refs.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/edit-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, images: refs }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Erreur serveur (${res.status})`);
      }
      const blob = await res.blob();
      setResult(URL.createObjectURL(blob));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.badge}>🧵 Studio Couture Bazin</span>
          <h1>
            Habille un modèle avec <span>ton tissu</span>
          </h1>
          <p>
            Ajoute une photo de ton bazin (ou d&apos;un modèle), décris le vêtement que tu
            veux, et l&apos;IA crée la tenue. Propulsé par Nano Banana (Google).
          </p>
        </header>

        <div className={styles.layout}>
          <section className={styles.controls}>
            <div className={styles.field}>
              <label>1. Tes photos de référence (jusqu&apos;à 3)</label>
              <div className={styles.refGrid}>
                {refs.map((src, i) => (
                  <div className={styles.refThumb} key={i}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`référence ${i + 1}`} />
                    <button onClick={() => removeRef(i)} aria-label="Retirer">✕</button>
                  </div>
                ))}
                {refs.length < 3 && (
                  <button className={styles.addRef} onClick={() => fileRef.current?.click()}>
                    <span>＋</span>
                    Ajouter
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onFiles}
                style={{ display: "none" }}
              />
              <p className={styles.hint}>
                Astuce : une photo nette de ton tissu bazin donne le meilleur résultat.
              </p>
            </div>

            <div className={styles.field}>
              <label htmlFor="prompt">2. Décris le vêtement</label>
              <textarea
                id="prompt"
                placeholder="Ex. : fais porter ce bazin à une femme, robe de couture élégante et tendance, pose mannequin, fond studio…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className={styles.chips}>
                {EXAMPLES.map((ex, i) => (
                  <button key={i} className={styles.chip} onClick={() => setPrompt(ex)}>
                    {ex.split(",")[0]}…
                  </button>
                ))}
              </div>
            </div>

            <button
              className={styles.genBtn}
              onClick={generate}
              disabled={loading || !prompt.trim() || refs.length === 0}
            >
              {loading ? "Création en cours…" : "✨ Créer le modèle"}
            </button>
            <p className={styles.hint}>
              La création prend 10 à 40 secondes. Reformule si le résultat ne te convient pas.
            </p>
          </section>

          <section className={styles.stage}>
            <div className={styles.canvas}>
              {loading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner} />
                  <span>L&apos;IA dessine ton modèle…</span>
                </div>
              ) : result ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result} alt="modèle généré" />
              ) : (
                <div className={styles.placeholder}>
                  <div className={styles.big}>🪡</div>
                  Ton modèle de couture apparaîtra ici.
                </div>
              )}
            </div>

            {result && !loading && (
              <div className={styles.resultBar}>
                <a className={`${styles.actionBtn} ${styles.primary}`} href={result} download={`couture-${Date.now()}.png`}>
                  ⬇ Télécharger
                </a>
                <button className={styles.actionBtn} onClick={generate}>
                  🔄 Refaire
                </button>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
          </section>
        </div>

        <p className={styles.foot}>
          Propulsé par Nano Banana (Google Gemini). · <a href="/photo">← Studio Photo</a> ·{" "}
          <a href="/">Accueil</a>
        </p>
      </div>
    </main>
  );
}
