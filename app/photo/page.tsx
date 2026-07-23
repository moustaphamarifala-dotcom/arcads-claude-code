"use client";

import { useEffect, useState } from "react";
import styles from "./photo.module.css";

const STYLES = ["Réaliste", "Portrait", "Paysage", "Produit", "Nourriture", "Rue / Vie"];

const FORMATS = [
  { value: "1:1", label: "Carré (1:1)" },
  { value: "3:2", label: "Paysage (3:2)" },
  { value: "2:3", label: "Portrait (2:3)" },
  { value: "16:9", label: "Large (16:9)" },
  { value: "9:16", label: "Story (9:16)" },
];

type Shot = { id: string; url: string; prompt: string };

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

const GALLERY_KEY = "photo.gallery";
const MAX_GALLERY = 8;

// Convertit l'image en donnée sauvegardable (pour survivre au rafraîchissement)
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function loadGallery(): Shot[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    return raw ? (JSON.parse(raw) as Shot[]) : [];
  } catch {
    return [];
  }
}

// Sauvegarde en gérant la limite d'espace : on réduit si nécessaire
function persistGallery(list: Shot[]) {
  let arr = list.slice(0, MAX_GALLERY);
  while (arr.length) {
    try {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(arr));
      return;
    } catch {
      arr = arr.slice(0, arr.length - 1);
    }
  }
  try { localStorage.removeItem(GALLERY_KEY); } catch {}
}

export default function PhotoStudio() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(STYLES[0]);
  const [format, setFormat] = useState("3:2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<Shot | null>(null);
  const [gallery, setGallery] = useState<Shot[]>([]);

  // Charge la galerie sauvegardée au démarrage
  useEffect(() => {
    setGallery(loadGallery());
  }, []);

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, aspectRatio: format }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Erreur serveur (${res.status})`);
      }

      const blob = await res.blob();
      const dataUrl = await blobToDataURL(blob);
      const shot = { id: newId(), url: dataUrl, prompt };
      setCurrent(shot);
      setGallery((prev) => {
        const next = [shot, ...prev].slice(0, MAX_GALLERY);
        persistGallery(next);
        return next;
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Supprimer une image de la galerie
  function removeShot(id: string) {
    setGallery((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persistGallery(next);
      return next;
    });
    setCurrent((cur) => (cur && cur.id === id ? null : cur));
  }

  // Vider toute la galerie
  function clearGallery() {
    if (!confirm("Supprimer toutes les images de la galerie ?")) return;
    setGallery([]);
    persistGallery([]);
    setCurrent(null);
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.badge}>📷 Studio Photo IA</span>
          <h1>
            Génère des images <span>ultra-réalistes</span>
          </h1>
          <p>
            Décris ce que tu imagines, choisis un style, et obtiens une photo réaliste
            en quelques secondes. Gratuit, sans clé API.
          </p>
        </header>

        <div className={styles.layout}>
          <section className={styles.controls}>
            <div className={styles.field}>
              <label htmlFor="prompt">Décris ton image</label>
              <textarea
                id="prompt"
                placeholder="Ex. : un jeune entrepreneur africain souriant dans son atelier de couture, lumière naturelle, tissus wax colorés en arrière-plan…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className={styles.rowTwo}>
              <div className={styles.field}>
                <label htmlFor="style">Style</label>
                <select id="style" value={style} onChange={(e) => setStyle(e.target.value)}>
                  {STYLES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="format">Format</label>
                <select id="format" value={format} onChange={(e) => setFormat(e.target.value)}>
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className={styles.genBtn} onClick={generate} disabled={loading || !prompt.trim()}>
              {loading ? "Génération en cours…" : "✨ Générer l'image"}
            </button>

            <p className={styles.tip}>
              Astuce : plus tu es précis (lumière, décor, ambiance, angle), plus le
              résultat est réaliste. La génération prend 10 à 30 secondes.
            </p>
          </section>

          <section className={styles.stage}>
            <div className={styles.canvas}>
              {loading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner} />
                  <span>Création de ton image…</span>
                </div>
              ) : current ? (
                <img src={current.url} alt={current.prompt} />
              ) : (
                <div className={styles.placeholder}>
                  <div className={styles.big}>🖼️</div>
                  Ton image apparaîtra ici.
                </div>
              )}
            </div>

            {current && !loading && (
              <div className={styles.resultBar}>
                <a className={`${styles.actionBtn} ${styles.primary}`} href={current.url} download={`image-${Date.now()}.jpg`}>
                  ⬇ Télécharger
                </a>
                <button className={styles.actionBtn} onClick={generate}>
                  🔄 Regénérer
                </button>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
          </section>
        </div>

        <section className={styles.gallery}>
          <div className={styles.galleryHead}>
            <h2>🖼 Ma galerie ({gallery.length})</h2>
            {gallery.length > 0 && (
              <button className={styles.clearBtn} onClick={clearGallery}>
                🗑 Tout effacer
              </button>
            )}
          </div>
          {gallery.length === 0 ? (
            <p className={styles.galleryEmpty}>
              Tes images générées apparaîtront ici et resteront sauvegardées sur cet
              appareil, même après avoir fermé la page. 🌱
            </p>
          ) : (
            <div className={styles.grid}>
              {gallery.map((s, i) => (
                <div className={styles.thumb} key={s.id}>
                  <img src={s.url} alt={s.prompt} onClick={() => setCurrent(s)} />
                  <div className={styles.thumbActions}>
                    <a
                      className={styles.thumbBtn}
                      href={s.url}
                      download={`image-${i}.jpg`}
                      title="Télécharger"
                    >
                      ⬇
                    </a>
                    <button
                      className={styles.thumbBtn}
                      onClick={() => removeShot(s.id)}
                      title="Supprimer"
                      aria-label="Supprimer cette image"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className={styles.foot}>
          Mode gratuit : modèle FLUX via Pollinations.ai · Pour une qualité maximale,
          ajoutez une clé Replicate (FLUX 1.1 Pro). · <a href="/">← Retour au studio</a>
        </p>
      </div>
    </main>
  );
}
