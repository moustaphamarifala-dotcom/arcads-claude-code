"use client";

import { useEffect, useRef, useState } from "react";

type VideoStatus = "idle" | "starting" | "processing" | "succeeded" | "failed";

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<VideoStatus>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loading = status === "starting" || status === "processing";

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function stopTimers() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  }

  async function generate() {
    if (!prompt.trim() || loading) return;
    setStatus("starting");
    setError(null);
    setVideoUrl(null);
    setElapsed(0);

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);

      setStatus("processing");
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/generate-video?id=${data.id}`);
          const poll = await pollRes.json();

          if (poll.status === "succeeded" && poll.videoUrl) {
            stopTimers();
            setVideoUrl(poll.videoUrl);
            setStatus("succeeded");
          } else if (poll.status === "failed" || poll.status === "canceled") {
            stopTimers();
            setError(poll.error ?? "La génération de la vidéo a échoué.");
            setStatus("failed");
          }
        } catch {
          // erreur réseau ponctuelle — on retentera au prochain tick
        }
      }, 5000);
    } catch (err) {
      stopTimers();
      setError((err as Error).message);
      setStatus("failed");
    }
  }

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="panel">
      <div className="field">
        <label htmlFor="video-prompt">Description de la vidéo</label>
        <textarea
          id="video-prompt"
          placeholder="Ex. : un drone survole une plage de sable blanc au lever du soleil, vagues douces, ambiance paisible…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="actions">
        <button className="btn" onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? "Génération en cours…" : "🎬 Générer la vidéo"}
        </button>
        {loading && (
          <span className="status">
            <span className="spinner" />
            {status === "starting"
              ? "Lancement…"
              : `Traitement… ${minutes}:${String(seconds).padStart(2, "0")} (2 à 5 min en général)`}
          </span>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}

      {videoUrl && (
        <div className="result">
          <div className="result-media">
            <video src={videoUrl} controls autoPlay loop muted />
          </div>
          <p className="hint">
            <a href={videoUrl} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
              Télécharger la vidéo ↗
            </a>
          </p>
        </div>
      )}

      <p className="hint">
        La génération vidéo prend généralement 2 à 5 minutes. Vous pouvez laisser
        cette page ouverte pendant le traitement. ⚠️ Cette fonctionnalité nécessite
        un jeton Replicate (les textes et images, eux, sont gratuits sans clé).
      </p>
    </div>
  );
}
