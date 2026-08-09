"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./instagram.module.css";

type Etat = {
  configured: boolean;
  connected: boolean;
  username?: string;
  accountType?: string;
  picture?: string;
  manuel?: boolean;
  expiresAt?: number;
};

type Format = "photo" | "reel" | "story";

const FORMATS: { id: Format; label: string; aide: string }[] = [
  { id: "photo", label: "🖼️ Photo", aide: "Image JPEG ou PNG, publiée dans le fil." },
  { id: "reel", label: "🎬 Reel", aide: "Vidéo MP4/MOV (3 s à 15 min), publiée en Reel." },
  { id: "story", label: "⚡ Story", aide: "Image ou vidéo, visible 24 h. Sans légende." },
];

const LEGENDE_MAX = 2200;

export default function InstagramPage() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [format, setFormat] = useState<Format>("photo");
  const [mediaUrl, setMediaUrl] = useState("");
  const [legende, setLegende] = useState("");
  const [jeton, setJeton] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [publie, setPublie] = useState<{ id: string; permalink?: string } | null>(null);

  const charger = useCallback(async () => {
    try {
      const r = await fetch("/api/instagram/session", { cache: "no-store" });
      setEtat(await r.json());
    } catch {
      setEtat({ configured: false, connected: false });
    }
  }, []);

  useEffect(() => {
    // Messages renvoyés par la page de retour d'Instagram (/api/instagram/callback)
    const params = new URLSearchParams(window.location.search);
    if (params.get("erreur")) setErreur(params.get("erreur"));
    if (params.get("message")) setMessage(params.get("message"));
    if (params.size) window.history.replaceState(null, "", "/instagram");
    charger();
  }, [charger]);

  async function connecterAvecJeton() {
    if (!jeton.trim() || enCours) return;
    setEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      const r = await fetch("/api/instagram/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: jeton }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? `Erreur (${r.status})`);
      setJeton("");
      setMessage(`Compte @${data.username ?? "instagram"} connecté.`);
      await charger();
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnCours(false);
    }
  }

  async function deconnecter() {
    setEnCours(true);
    try {
      await fetch("/api/instagram/session", { method: "DELETE" });
      setMessage("Compte déconnecté.");
      setErreur(null);
      setPublie(null);
      await charger();
    } finally {
      setEnCours(false);
    }
  }

  async function publier() {
    if (!mediaUrl.trim() || enCours) return;
    setEnCours(true);
    setErreur(null);
    setMessage(null);
    setPublie(null);
    try {
      const r = await fetch("/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, mediaUrl, caption: legende }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? `Erreur (${r.status})`);
      setPublie(data);
      setMessage("Publié sur Instagram ✅");
      setLegende("");
      setMediaUrl("");
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnCours(false);
    }
  }

  const estVideo = /\.(mp4|mov)(\?|$)/i.test(mediaUrl);
  const jours = etat?.expiresAt ? Math.max(0, Math.round((etat.expiresAt - Date.now()) / 86400000)) : null;

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.badge}>📸 Instagram</span>
          <h1>
            Connecte ton <span>compte Instagram</span>
          </h1>
          <p>
            Relie un compte Instagram Professionnel ou Créateur, puis publie directement
            tes photos, Reels et stories créés dans le Studio.
          </p>
        </header>

        {message && <div className={styles.ok}>{message}</div>}
        {erreur && <div className={styles.erreur}>{erreur}</div>}

        <section className={styles.carte}>
          <h2 className={styles.titre}>1. Le compte</h2>

          {etat === null && <p className={styles.muted}>Vérification de la connexion…</p>}

          {etat && etat.connected && (
            <div className={styles.compte}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {etat.picture && <img className={styles.avatar} src={etat.picture} alt="" />}
              <div>
                <strong>@{etat.username ?? "compte connecté"}</strong>
                <p className={styles.muted}>
                  {etat.accountType ? `Compte ${etat.accountType.toLowerCase()}` : "Compte Instagram"}
                  {jours !== null && ` · connexion valable encore ${jours} jour${jours > 1 ? "s" : ""}`}
                  {etat.manuel && " · jeton collé à la main"}
                </p>
              </div>
              <button className={styles.secondaire} onClick={deconnecter} disabled={enCours}>
                Déconnecter
              </button>
            </div>
          )}

          {etat && !etat.connected && (
            <>
              {etat.configured ? (
                <>
                  <p className={styles.muted}>
                    Instagram va te demander d&apos;autoriser le Studio à lire ton profil et à publier
                    pour toi. Tu peux retirer cette autorisation à tout moment depuis Instagram.
                  </p>
                  <a className={styles.principal} href="/api/instagram/auth">
                    Se connecter avec Instagram
                  </a>
                </>
              ) : (
                <p className={styles.muted}>
                  La connexion en un clic demande une application Meta
                  (<code>INSTAGRAM_APP_ID</code> et <code>INSTAGRAM_APP_SECRET</code>). Sans elle,
                  colle simplement un jeton d&apos;accès ci-dessous.
                </p>
              )}

              <details className={styles.details}>
                <summary>Coller un jeton d&apos;accès à la main</summary>
                <p className={styles.muted}>
                  Depuis{" "}
                  <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer">
                    l&apos;explorateur d&apos;API Meta
                  </a>
                  , génère un jeton avec les permissions <code>instagram_business_basic</code> et{" "}
                  <code>instagram_business_content_publish</code>, puis colle-le ici.
                </p>
                <input
                  className={styles.input}
                  type="password"
                  value={jeton}
                  onChange={(e) => setJeton(e.target.value)}
                  placeholder="IGAA…"
                  autoComplete="off"
                />
                <button className={styles.principal} onClick={connecterAvecJeton} disabled={enCours || !jeton.trim()}>
                  {enCours ? "Vérification…" : "Relier ce compte"}
                </button>
              </details>
            </>
          )}
        </section>

        <section className={`${styles.carte} ${!etat?.connected ? styles.desactive : ""}`}>
          <h2 className={styles.titre}>2. Publier</h2>

          <div className={styles.formats}>
            {FORMATS.map((f) => (
              <button
                key={f.id}
                className={`${styles.formatBtn} ${format === f.id ? styles.actif : ""}`}
                onClick={() => setFormat(f.id)}
                disabled={!etat?.connected}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className={styles.aide}>{FORMATS.find((f) => f.id === format)?.aide}</p>

          <label className={styles.label} htmlFor="media">
            Adresse du média (https)
          </label>
          <input
            id="media"
            className={styles.input}
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://…/mon-image.jpg"
            disabled={!etat?.connected}
          />
          <p className={styles.aide}>
            Instagram télécharge le fichier lui-même : l&apos;adresse doit être publique. Les images
            du Studio Photo et du générateur d&apos;images conviennent — copie leur adresse
            (clic droit → copier l&apos;adresse de l&apos;image).
          </p>

          {/^https:\/\//i.test(mediaUrl) && (
            <div className={styles.apercu}>
              {estVideo ? (
                <video src={mediaUrl} controls />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl} alt="Aperçu du média à publier" />
              )}
            </div>
          )}

          {format !== "story" && (
            <>
              <label className={styles.label} htmlFor="legende">
                Légende <span className={styles.compteur}>{legende.length}/{LEGENDE_MAX}</span>
              </label>
              <textarea
                id="legende"
                className={styles.textarea}
                value={legende}
                maxLength={LEGENDE_MAX}
                onChange={(e) => setLegende(e.target.value)}
                placeholder="Écris ta légende, avec tes hashtags…"
                disabled={!etat?.connected}
              />
            </>
          )}

          <button
            className={styles.principal}
            onClick={publier}
            disabled={!etat?.connected || enCours || !mediaUrl.trim()}
          >
            {enCours ? "Publication en cours…" : "Publier sur Instagram"}
          </button>

          {publie && (
            <p className={styles.ok}>
              Publication créée.{" "}
              {publie.permalink && (
                <a href={publie.permalink} target="_blank" rel="noreferrer">
                  Voir sur Instagram →
                </a>
              )}
            </p>
          )}
        </section>

        <p className={styles.retour}>
          <a href="/">← Retour au Studio</a>
        </p>
      </div>
    </main>
  );
}
