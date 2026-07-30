"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_SCENES,
  decouperScenes,
  formaterDuree,
  kenBurns,
  retourALaLigne,
  type Scene,
} from "../lib/clip";
import styles from "./clip.module.css";

/**
 * Studio Clip : compose une vidéo animée à partir d'un script, entièrement
 * dans le navigateur — aucune clé API, aucun coût, aucun serveur de rendu.
 *
 * Les images de chaque scène viennent de Pollinations.ai (déjà utilisé par
 * /api/generate-image, gratuit et sans clé) ; à défaut, un dégradé animé sert
 * de fond. Le montage — panoramique-zoom, fondus enchaînés, sous-titres
 * incrustés — est calculé image par image sur un <canvas> et enregistré en
 * temps réel avec MediaRecorder. C'est la contrainte de cette approche : une
 * vidéo de 20 secondes prend 20 secondes à produire, il n'y a pas de raccourci
 * sans passer par un service payant.
 */

type Aspect = "9:16" | "1:1" | "16:9";

const DIMENSIONS: Record<Aspect, { w: number; h: number }> = {
  "9:16": { w: 720, h: 1280 },
  "1:1": { w: 1080, h: 1080 },
  "16:9": { w: 1280, h: 720 },
};

// Fond de repli quand une scène n'a pas d'image : un dégradé par scène,
// piochée dans une palette fixe pour rester lisible sous les sous-titres.
const PALETTE: [string, string][] = [
  ["#1b2a4a", "#0a0c10"],
  ["#2a1b3d", "#0a0c10"],
  ["#0f3d3a", "#0a0c10"],
  ["#3d1b2a", "#0a0c10"],
  ["#1b3d2a", "#0a0c10"],
  ["#3d2a1b", "#0a0c10"],
];

const TRANSITION_MAX = 0.6;
const EXEMPLES = [
  "Le soleil se lève sur Dakar.\n\nUn marché s'anime déjà, entre épices et éclats de rire.\n\nUne nouvelle journée commence.",
];

type SceneUI = Scene & {
  imageUrl: string | null;
  chargement: boolean;
  erreur: string | null;
};

function detecterSupport() {
  if (typeof window === "undefined") return false;
  return (
    typeof window.MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function"
  );
}

export default function ClipPage() {
  const [script, setScript] = useState("");
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [dureeParScene, setDureeParScene] = useState(4);
  const [sousTitres, setSousTitres] = useState(true);
  const [fichierAudio, setFichierAudio] = useState<File | null>(null);
  const [scenes, setScenes] = useState<SceneUI[]>([]);
  const [etape, setEtape] = useState<"script" | "scenes" | "rendu">("script");

  const [enRendu, setEnRendu] = useState(false);
  const [progres, setProgres] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState("video/webm");
  const [erreurRendu, setErreurRendu] = useState<string | null>(null);
  const [avisAudio, setAvisAudio] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Le rendu serveur n'a pas accès à `window` : on démarre avec la même
  // valeur des deux côtés (false) et on corrige après le montage, pour éviter
  // un mismatch d'hydratation entre le HTML serveur et le premier rendu client.
  const [supporte, setSupporte] = useState(false);
  const dureeTotale = scenes.length * dureeParScene;

  useEffect(() => {
    setSupporte(detecterSupport());
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function decouper() {
    const decoupees = decouperScenes(script);
    setScenes(
      decoupees.map((s) => ({ ...s, imageUrl: null, chargement: false, erreur: null })),
    );
    setEtape(decoupees.length > 0 ? "scenes" : "script");
    setVideoUrl(null);
    setErreurRendu(null);
  }

  async function genererImage(index: number) {
    setScenes((prev) =>
      prev.map((s, i) => (i === index ? { ...s, chargement: true, erreur: null } : s)),
    );

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: scenes[index].promptImage, aspectRatio: aspect }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);

      setScenes((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, imageUrl: data.imageUrl, chargement: false } : s,
        ),
      );
    } catch (err) {
      setScenes((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, chargement: false, erreur: (err as Error).message }
            : s,
        ),
      );
    }
  }

  async function genererImagesManquantes() {
    for (let i = 0; i < scenes.length; i++) {
      if (!scenes[i].imageUrl) await genererImage(i);
    }
  }

  function supprimerScene(index: number) {
    setScenes((prev) => prev.filter((_, i) => i !== index));
  }

  function modifierTexte(index: number, texte: string) {
    setScenes((prev) => prev.map((s, i) => (i === index ? { ...s, texte } : s)));
  }

  function modifierPrompt(index: number, promptImage: string) {
    setScenes((prev) => prev.map((s, i) => (i === index ? { ...s, promptImage } : s)));
  }

  /* ------------------------------------------------------------------ */
  /* Rendu canvas + enregistrement                                       */
  /* ------------------------------------------------------------------ */

  async function chargerImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image inaccessible"));
      img.src = url;
    });
  }

  function dessinerCouverture(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    w: number,
    h: number,
    echelle: number,
    dx: number,
    dy: number,
  ) {
    const couverture = Math.max(w / img.width, h / img.height);
    const drawW = img.width * couverture * echelle;
    const drawH = img.height * couverture * echelle;
    const overscanX = drawW - w;
    const overscanY = drawH - h;
    const x = -(overscanX / 2) + dx * overscanX;
    const y = -(overscanY / 2) + dy * overscanY;
    ctx.drawImage(img, x, y, drawW, drawH);
  }

  function dessinerFond(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    index: number,
    dx: number,
    dy: number,
  ) {
    const [a, b] = PALETTE[index % PALETTE.length];
    const degrade = ctx.createLinearGradient(0, 0, w, h);
    degrade.addColorStop(0, a);
    degrade.addColorStop(1, b);
    ctx.fillStyle = degrade;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2 + dx * w * 0.4;
    const cy = h / 2 + dy * h * 0.4;
    const lueur = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
    lueur.addColorStop(0, "rgba(255,255,255,0.10)");
    lueur.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = lueur;
    ctx.fillRect(0, 0, w, h);
  }

  function dessinerSousTitre(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    texte: string,
    alpha: number,
  ) {
    if (alpha <= 0.01 || !texte) return;
    const taille = Math.round(w * 0.042);
    ctx.font = `700 ${taille}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    const lignes = retourALaLigne(texte, w * 0.84, (s) => ctx.measureText(s).width);
    const interligne = taille * 1.3;
    const hauteurBloc = lignes.length * interligne + taille * 1.4;

    ctx.save();
    ctx.globalAlpha = alpha;
    const bande = ctx.createLinearGradient(0, h - hauteurBloc, 0, h);
    bande.addColorStop(0, "rgba(0,0,0,0)");
    bande.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = bande;
    ctx.fillRect(0, h - hauteurBloc, w, hauteurBloc);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 6;
    lignes.forEach((ligne, i) => {
      const y = h - taille * 0.9 - (lignes.length - 1 - i) * interligne;
      ctx.fillText(ligne, w / 2, y);
    });
    ctx.restore();
  }

  async function construireFluxAudio(fichier: File) {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const contexte = new AudioCtx();
    const audio = new Audio(URL.createObjectURL(fichier));
    audio.loop = true;

    const captureFn =
      (audio as unknown as { captureStream?: () => MediaStream }).captureStream ??
      (audio as unknown as { mozCaptureStream?: () => MediaStream }).mozCaptureStream;
    if (!captureFn) throw new Error("captureStream non supporté sur ce navigateur");

    const source = contexte.createMediaElementSource(audio);
    const destination = contexte.createMediaStreamDestination();
    source.connect(destination);
    source.connect(contexte.destination); // on entend aussi la musique pendant le rendu

    await audio.play();
    return { stream: destination.stream, audio, contexte };
  }

  async function genererVideo() {
    if (!supporte || scenes.length === 0 || enRendu) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setEnRendu(true);
    setErreurRendu(null);
    setAvisAudio(null);
    setVideoUrl(null);
    setProgres(0);

    const { w, h } = DIMENSIONS[aspect];
    canvas.width = w;
    canvas.height = h;
    const contexteBrut = canvas.getContext("2d");
    if (!contexteBrut) {
      setErreurRendu("Impossible d'initialiser le canvas.");
      setEnRendu(false);
      return;
    }
    // Capturé dans une constante non-nullable : le rétrécissement de type du
    // contrôle ci-dessus ne traverse pas les fonctions imbriquées plus bas.
    const ctx: CanvasRenderingContext2D = contexteBrut;

    // Précharge les images disponibles ; une scène sans image (ou dont
    // l'image ne charge pas) utilise le fond en dégradé, sans bloquer le rendu.
    const images = new Map<number, HTMLImageElement>();
    await Promise.all(
      scenes.map(async (s, i) => {
        if (!s.imageUrl) return;
        try {
          images.set(i, await chargerImage(s.imageUrl));
        } catch {
          /* fond de repli utilisé automatiquement */
        }
      }),
    );

    let audioTrack: { stream: MediaStream; audio: HTMLAudioElement; contexte: AudioContext } | null = null;
    if (fichierAudio) {
      try {
        audioTrack = await construireFluxAudio(fichierAudio);
      } catch {
        setAvisAudio(
          "La musique n'a pas pu être intégrée sur ce navigateur — la vidéo sera silencieuse.",
        );
      }
    }

    const canvasStream = (canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(30);
    const pistes = [
      ...canvasStream.getVideoTracks(),
      ...(audioTrack ? audioTrack.stream.getAudioTracks() : []),
    ];
    const flux = new MediaStream(pistes);

    const candidats = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    const mimeType = candidats.find((c) => MediaRecorder.isTypeSupported(c)) ?? "video/webm";

    const enregistreur = new MediaRecorder(flux, { mimeType });
    const morceaux: BlobPart[] = [];
    enregistreur.ondataavailable = (e) => {
      if (e.data.size > 0) morceaux.push(e.data);
    };

    const nettoyer = () => {
      if (audioTrack) {
        audioTrack.audio.pause();
        audioTrack.contexte.close().catch(() => {});
      }
    };

    const totalDuree = scenes.length * dureeParScene;
    const transitionDuree = Math.min(TRANSITION_MAX, dureeParScene * 0.3);
    const depart = performance.now();
    let idAnimation = 0;

    const dessinerImage = (index: number, echelle: number, dx: number, dy: number) => {
      const img = images.get(index);
      if (img) dessinerCouverture(ctx, img, w, h, echelle, dx, dy);
      else dessinerFond(ctx, w, h, index, dx, dy);
    };

    function image() {
      const ecoule = (performance.now() - depart) / 1000;
      setProgres(Math.min(ecoule / totalDuree, 1));

      const indexBrut = Math.floor(ecoule / dureeParScene);
      const indexScene = Math.min(indexBrut, scenes.length - 1);
      const tDansScene = ecoule - indexScene * dureeParScene;
      const progresScene = Math.min(tDansScene / dureeParScene, 1);
      const dernierePlan = indexScene === scenes.length - 1;
      const progresTransition =
        !dernierePlan && tDansScene > dureeParScene - transitionDuree
          ? (tDansScene - (dureeParScene - transitionDuree)) / transitionDuree
          : 0;

      const sens = indexScene % 2 === 0 ? 1 : -1;
      const cadre = kenBurns(progresScene, sens);
      dessinerImage(indexScene, cadre.echelle, cadre.dx, cadre.dy);

      if (sousTitres) dessinerSousTitre(ctx, w, h, scenes[indexScene].texte, 1 - progresTransition);

      if (progresTransition > 0) {
        const sensSuivant = (indexScene + 1) % 2 === 0 ? 1 : -1;
        const cadreSuivant = kenBurns(0, sensSuivant);
        ctx.save();
        ctx.globalAlpha = progresTransition;
        dessinerImage(indexScene + 1, cadreSuivant.echelle, cadreSuivant.dx, cadreSuivant.dy);
        ctx.restore();
        if (sousTitres) {
          dessinerSousTitre(ctx, w, h, scenes[indexScene + 1].texte, progresTransition);
        }
      }

      if (ecoule < totalDuree) {
        idAnimation = requestAnimationFrame(image);
      } else {
        enregistreur.stop();
      }
    }

    enregistreur.onstop = () => {
      cancelAnimationFrame(idAnimation);
      nettoyer();
      const blob = new Blob(morceaux, { type: mimeType });
      setVideoType(mimeType);
      setVideoUrl(URL.createObjectURL(blob));
      setEnRendu(false);
      setProgres(1);
      setEtape("rendu");
    };

    enregistreur.onerror = () => {
      cancelAnimationFrame(idAnimation);
      nettoyer();
      setErreurRendu("L'enregistrement a échoué en cours de route.");
      setEnRendu(false);
    };

    enregistreur.start();
    idAnimation = requestAnimationFrame(image);
  }

  function extensionDe(mime: string): string {
    return mime.includes("webm") ? "webm" : "mp4";
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.badge}>🎬 Studio Clip — vidéos gratuites</span>
          <h1>
            Un script, <span>une vidéo</span>
          </h1>
          <p>
            Colle un texte, l&apos;app le découpe en scènes, génère une image
            IA gratuite pour chacune (Pollinations.ai, sans clé) puis monte le
            tout — panoramique-zoom, fondus, sous-titres incrustés — et
            l&apos;enregistre en vidéo téléchargeable. Tout se passe dans ton
            navigateur : aucun serveur de rendu, aucun coût, aucune limite
            d&apos;usage.
          </p>
        </header>

        {!supporte && (
          <p className={styles.avertissement}>
            Ton navigateur ne permet pas d&apos;enregistrer de vidéo depuis une
            page web (il manque MediaRecorder ou captureStream). Essaie avec
            une version récente de Chrome, Edge ou Firefox.
          </p>
        )}

        <section className={styles.bloc}>
          <h2>1. Le script</h2>
          <textarea
            className={styles.zoneTexte}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Écris ton texte. Sépare les scènes par une ligne vide, ou laisse tout en un bloc — l'app le découpera automatiquement."
          />

          <div className={styles.reglages}>
            <label className={styles.champReglage}>
              Format
              <select value={aspect} onChange={(e) => setAspect(e.target.value as Aspect)}>
                <option value="9:16">9:16 — Stories / Reels</option>
                <option value="1:1">1:1 — Carré</option>
                <option value="16:9">16:9 — Paysage</option>
              </select>
            </label>

            <label className={styles.champReglage}>
              Durée par scène : {dureeParScene}s
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={dureeParScene}
                onChange={(e) => setDureeParScene(Number(e.target.value))}
              />
            </label>

            <label className={styles.bascule}>
              <input
                type="checkbox"
                checked={sousTitres}
                onChange={(e) => setSousTitres(e.target.checked)}
              />
              Sous-titres incrustés
            </label>

            <label className={styles.fichierAudio}>
              Musique (optionnelle, ton propre fichier)
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setFichierAudio(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className={styles.actions}>
            <button className={styles.bouton} onClick={decouper} disabled={!script.trim()}>
              Découper en scènes
            </button>
            {EXEMPLES.map((ex, i) => (
              <button
                key={i}
                className={`${styles.bouton} ${styles.boutonSecondaire}`}
                onClick={() => setScript(ex)}
              >
                Exemple
              </button>
            ))}
          </div>
        </section>

        {scenes.length > 0 && (
          <section className={styles.bloc}>
            <h2>
              2. Les scènes ({scenes.length}{scenes.length === MAX_SCENES ? ` — maximum` : ""})
            </h2>
            <div className={styles.scenes}>
              {scenes.map((s, i) => (
                <div key={i} className={styles.scene}>
                  <div className={styles.sceneVignette}>
                    <span className={styles.numero}>{i + 1}</span>
                    {s.imageUrl && <img src={s.imageUrl} alt="" />}
                  </div>
                  <div className={styles.sceneCorps}>
                    <textarea
                      className={styles.sceneTexte}
                      value={s.texte}
                      onChange={(e) => modifierTexte(i, e.target.value)}
                    />
                    <input
                      className={styles.scenePrompt}
                      value={s.promptImage}
                      onChange={(e) => modifierPrompt(i, e.target.value)}
                      placeholder="Prompt de l'image générée"
                    />
                    <div className={styles.sceneActions}>
                      <button
                        className={styles.miniBouton}
                        onClick={() => genererImage(i)}
                        disabled={s.chargement}
                      >
                        {s.chargement ? "Génération…" : s.imageUrl ? "Régénérer l'image" : "Générer une image"}
                      </button>
                      <button
                        className={`${styles.miniBouton} ${styles.miniBoutonAlerte}`}
                        onClick={() => supprimerScene(i)}
                      >
                        Supprimer
                      </button>
                    </div>
                    {s.erreur && <p className={styles.sceneErreur}>{s.erreur}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <button
                className={`${styles.bouton} ${styles.boutonSecondaire}`}
                onClick={genererImagesManquantes}
              >
                Générer les images manquantes
              </button>
              <button
                className={styles.bouton}
                onClick={genererVideo}
                disabled={!supporte || enRendu || scenes.length === 0}
              >
                {enRendu ? "Génération en cours…" : `Générer la vidéo (~${formaterDuree(dureeTotale)})`}
              </button>
            </div>
          </section>
        )}

        {(scenes.length > 0 || videoUrl || erreurRendu) && (
          <section className={styles.bloc}>
            <h2>3. La vidéo</h2>

            {erreurRendu && <p className={styles.avertissement}>{erreurRendu}</p>}
            {avisAudio && <p className={styles.avertissement}>{avisAudio}</p>}

            <div className={styles.apercu} style={{ display: enRendu || videoUrl ? "flex" : "none" }}>
              {/*
                Le canvas doit rester monté dès qu'une vidéo est possible :
                genererVideo() lit canvasRef.current dès le premier clic, avant
                le moindre re-rendu déclenché par setEnRendu(true). display:none
                masque sans démonter, donc la référence reste valide même avant
                le premier lancement.
              */}
              <div className={styles.toileCadre} style={{ display: videoUrl ? "none" : "block" }}>
                <canvas ref={canvasRef} />
              </div>
              {videoUrl && (
                <div className={styles.toileCadre}>
                  <video src={videoUrl} controls playsInline />
                </div>
              )}

              {enRendu && (
                <>
                  <div className={styles.progression}>
                    <div
                      className={styles.progressionBarre}
                      style={{ width: `${Math.round(progres * 100)}%` }}
                    />
                  </div>
                  <p className={styles.progressionTexte}>
                    Enregistrement en temps réel — {Math.round(progres * 100)}%
                  </p>
                </>
              )}

              {videoUrl && (
                <a
                  className={styles.bouton}
                  href={videoUrl}
                  download={`clip.${extensionDe(videoType)}`}
                >
                  Télécharger la vidéo
                </a>
              )}
            </div>
          </section>
        )}

        <footer className={styles.footer}>
          <a href="/" className={styles.retour}>
            ← Retour au studio
          </a>
          <p>
            Les images viennent de Pollinations.ai (gratuit, sans clé) ; sans
            image disponible, un fond animé sert de repli. Le montage est
            calculé et enregistré entièrement dans ton navigateur — aucune
            donnée n&apos;est envoyée à un serveur de rendu, et rien n&apos;est
            conservé au-delà de cette page.
          </p>
        </footer>
      </div>
    </div>
  );
}
