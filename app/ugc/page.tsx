"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ugc.module.css";

type Scene = {
  temps: string;
  role: string;
  voix: string;
  visuel: string;
  texte_ecran: string;
};

type Script = {
  titre: string;
  accroche: string;
  scenes: Scene[];
  cta: string;
  description_publication: string;
  hashtags: string[];
  avatar: { description: string };
};

const ANGLES = [
  "Témoignage authentique",
  "Problème / Solution",
  "Avant / Après",
  "Unboxing",
  "3 astuces",
  "Ce que j'aurais aimé savoir",
  "Comparaison",
];

const TONS = ["Naturel et amical", "Enthousiaste", "Expert et rassurant", "Drôle", "Confidence"];
const PLATEFORMES = ["TikTok", "Instagram Reels", "YouTube Shorts"];
const DUREES = [15, 30, 45];

const EXEMPLES = [
  {
    produit: "Crème hydratante au beurre de karité",
    benefices: "100 % naturelle, fabriquée à Bamako, apaise les peaux sèches en 3 jours, pot de 200 ml à 8 000 F CFA",
    audience: "Femmes de 25 à 40 ans qui ont la peau sèche",
  },
  {
    produit: "Application de suivi de dépenses",
    benefices: "Gratuite, fonctionne hors ligne, catégorise automatiquement les dépenses, alerte avant le découvert",
    audience: "Jeunes actifs qui n'arrivent pas à épargner",
  },
  {
    produit: "Atelier de couture bazin sur mesure",
    benefices: "Tenues livrées en 5 jours, retouches offertes, envoi partout dans le pays",
    audience: "Personnes qui préparent un mariage ou une fête",
  },
];

const STORAGE_KEY = "ugc.dernier";

export default function UgcStudio() {
  const [produit, setProduit] = useState("");
  const [benefices, setBenefices] = useState("");
  const [audience, setAudience] = useState("");
  const [angle, setAngle] = useState(ANGLES[1]);
  const [ton, setTon] = useState(TONS[0]);
  const [plateforme, setPlateforme] = useState(PLATEFORMES[0]);
  const [duree, setDuree] = useState(30);

  const [script, setScript] = useState<Script | null>(null);
  const [moteur, setMoteur] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [visuels, setVisuels] = useState<Record<number, string>>({});
  const [visuelEnCours, setVisuelEnCours] = useState<number | null>(null);

  const [voix, setVoix] = useState("femme");
  const [audio, setAudio] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioNote, setAudioNote] = useState<string | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStatut, setVideoStatut] = useState<string | null>(null);
  const [videoErreur, setVideoErreur] = useState<string | null>(null);

  const resultatRef = useRef<HTMLDivElement>(null);

  // Reprend le dernier script généré sur cet appareil
  useEffect(() => {
    try {
      const brut = localStorage.getItem(STORAGE_KEY);
      if (!brut) return;
      const sauvegarde = JSON.parse(brut);
      if (sauvegarde?.script) setScript(sauvegarde.script);
      if (sauvegarde?.produit) setProduit(sauvegarde.produit);
      if (sauvegarde?.benefices) setBenefices(sauvegarde.benefices);
      if (sauvegarde?.audience) setAudience(sauvegarde.audience);
    } catch {
      /* stockage indisponible : on repart d'une page vierge */
    }
  }, []);

  function sauvegarder(nouveau: Script) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ script: nouveau, produit, benefices, audience }),
      );
    } catch {
      /* quota dépassé : sans conséquence */
    }
  }

  async function genererScript() {
    if (!produit.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAvatar(null);
    setVisuels({});
    setAudio(null);
    setVideoUrl(null);
    setVideoStatut(null);
    setVideoErreur(null);

    try {
      const res = await fetch("/api/ugc-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produit, benefices, audience, angle, ton, plateforme, duree }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);

      setScript(data.script);
      setMoteur(data.moteur);
      sauvegarder(data.script);
      setTimeout(
        () => resultatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        150,
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function genererImage(prompt: string, kind: string): Promise<string> {
    const res = await fetch("/api/ugc-visual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, kind }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? `Erreur serveur (${res.status})`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  async function genererAvatar() {
    if (!script || avatarLoading) return;
    setAvatarLoading(true);
    setError(null);
    try {
      setAvatar(await genererImage(script.avatar.description, "avatar"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAvatarLoading(false);
    }
  }

  async function genererVisuel(index: number) {
    if (!script || visuelEnCours !== null) return;
    setVisuelEnCours(index);
    setError(null);
    try {
      // On rappelle la description du créateur pour garder le même visage d'une scène à l'autre
      const prompt = `${script.scenes[index].visuel}. Personne à l'image : ${script.avatar.description}`;
      const url = await genererImage(prompt, "scene");
      setVisuels((prev) => ({ ...prev, [index]: url }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setVisuelEnCours(null);
    }
  }

  // Lecture gratuite par la voix du navigateur
  function lire(texte: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setAudioNote("Ce navigateur ne sait pas lire le texte à voix haute.");
      return;
    }
    window.speechSynthesis.cancel();
    const message = new SpeechSynthesisUtterance(texte);
    message.lang = "fr-FR";
    message.rate = 1.05;
    window.speechSynthesis.speak(message);
  }

  function texteVoixOff(s: Script): string {
    return [...s.scenes.map((sc) => sc.voix), s.cta].filter(Boolean).join(" ");
  }

  async function genererVoixOff() {
    if (!script || audioLoading) return;
    setAudioLoading(true);
    setAudioNote(null);
    setError(null);
    try {
      const res = await fetch("/api/ugc-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: texteVoixOff(script), voix }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Erreur serveur (${res.status})`);
      }
      const blob = await res.blob();
      setAudio(URL.createObjectURL(blob));
    } catch (err) {
      setAudioNote((err as Error).message);
    } finally {
      setAudioLoading(false);
    }
  }

  // Vidéo animée de la scène d'accroche (nécessite un jeton Replicate)
  async function genererVideo() {
    if (!script || videoStatut === "en cours") return;
    setVideoErreur(null);
    setVideoUrl(null);
    setVideoStatut("en cours");

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${script.scenes[0]?.visuel ?? script.accroche}. Vidéo verticale filmée au smartphone, rendu authentique UGC. Personne à l'image : ${script.avatar.description}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);

      const id = data.id as string;
      for (let essai = 0; essai < 60; essai++) {
        await new Promise((r) => setTimeout(r, 5000));
        const suivi = await fetch(`/api/generate-video?id=${id}`);
        const etat = await suivi.json();
        if (etat.status === "succeeded" && etat.videoUrl) {
          setVideoUrl(etat.videoUrl);
          setVideoStatut("terminé");
          return;
        }
        if (etat.status === "failed" || etat.status === "canceled") {
          throw new Error(etat.error ?? "La génération vidéo a échoué.");
        }
      }
      throw new Error("La génération vidéo prend trop de temps. Réessaie plus tard.");
    } catch (err) {
      setVideoErreur((err as Error).message);
      setVideoStatut(null);
    }
  }

  function scriptEnTexte(s: Script): string {
    const lignes = [
      s.titre,
      "",
      `Accroche : ${s.accroche}`,
      "",
      ...s.scenes.flatMap((sc, i) => [
        `— Scène ${i + 1} (${sc.temps}) · ${sc.role}`,
        `  Voix   : ${sc.voix}`,
        `  Visuel : ${sc.visuel}`,
        `  Écran  : ${sc.texte_ecran}`,
        "",
      ]),
      `Appel à l'action : ${s.cta}`,
      "",
      `Légende : ${s.description_publication}`,
      `Hashtags : ${s.hashtags.join(" ")}`,
      "",
      `Créateur à l'image : ${s.avatar.description}`,
    ];
    return lignes.join("\n");
  }

  function telechargerScript() {
    if (!script) return;
    const blob = new Blob([scriptEnTexte(script)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `script-ugc-${Date.now()}.txt`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  async function copierScript() {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(scriptEnTexte(script));
      setAudioNote("Script copié dans le presse-papiers.");
    } catch {
      setAudioNote("Copie impossible sur ce navigateur : utilise le téléchargement.");
    }
  }

  function remplirExemple(i: number) {
    setProduit(EXEMPLES[i].produit);
    setBenefices(EXEMPLES[i].benefices);
    setAudience(EXEMPLES[i].audience);
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.badge}>🎬 Studio UGC</span>
          <h1>
            Crée des vidéos <span>UGC</span> pour ton produit
          </h1>
          <p>
            Décris ton produit : l&apos;IA écrit le script vertical (accroche, scènes, appel à
            l&apos;action), génère le créateur à l&apos;image, les visuels de chaque scène et la voix
            off. Gratuit, sans clé API.
          </p>
        </header>

        <section className={styles.card}>
          <div className={styles.field}>
            <label htmlFor="produit">Ton produit ou service</label>
            <input
              id="produit"
              className={styles.input}
              placeholder="Ex. : crème hydratante au beurre de karité"
              value={produit}
              onChange={(e) => setProduit(e.target.value)}
            />
            <div className={styles.examples}>
              {EXEMPLES.map((ex, i) => (
                <button key={i} className={styles.chip} onClick={() => remplirExemple(i)}>
                  {ex.produit}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="benefices">Ce qu&apos;il faut savoir (bénéfices, prix, preuves)</label>
            <textarea
              id="benefices"
              placeholder="Ex. : 100 % naturelle, apaise les peaux sèches en 3 jours, pot de 200 ml à 8 000 F CFA…"
              value={benefices}
              onChange={(e) => setBenefices(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="audience">À qui tu parles</label>
            <input
              id="audience"
              className={styles.input}
              placeholder="Ex. : femmes de 25 à 40 ans qui ont la peau sèche"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="angle">Angle créatif</label>
              <select id="angle" value={angle} onChange={(e) => setAngle(e.target.value)}>
                {ANGLES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="ton">Ton</label>
              <select id="ton" value={ton} onChange={(e) => setTon(e.target.value)}>
                {TONS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="plateforme">Plateforme</label>
              <select
                id="plateforme"
                value={plateforme}
                onChange={(e) => setPlateforme(e.target.value)}
              >
                {PLATEFORMES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="duree">Durée</label>
              <select
                id="duree"
                value={duree}
                onChange={(e) => setDuree(Number(e.target.value))}
              >
                {DUREES.map((d) => (
                  <option key={d} value={d}>
                    {d} secondes
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className={styles.genBtn}
            onClick={genererScript}
            disabled={loading || !produit.trim()}
          >
            {loading ? "Écriture du script…" : "✨ Écrire le script UGC"}
          </button>

          {error && <div className={styles.error}>{error}</div>}
        </section>

        {script && (
          <div ref={resultatRef}>
            <section className={styles.card}>
              <div className={styles.resultHead}>
                <h2>{script.titre}</h2>
                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={copierScript}>
                    📋 Copier
                  </button>
                  <button className={styles.actionBtn} onClick={telechargerScript}>
                    ⬇ Télécharger
                  </button>
                </div>
              </div>

              <p className={styles.hook}>
                <strong>Accroche (3 premières secondes)</strong>
                {script.accroche}
              </p>

              {moteur && (
                <p className={styles.moteur}>
                  Script écrit par {moteur === "claude" ? "Claude" : "le moteur gratuit"}.
                </p>
              )}
            </section>

            <section className={styles.card}>
              <h3 className={styles.sectionTitle}>🧑 Le créateur à l&apos;image</h3>
              <p className={styles.avatarDesc}>{script.avatar.description}</p>
              <div className={styles.avatarRow}>
                <button
                  className={styles.actionBtn}
                  onClick={genererAvatar}
                  disabled={avatarLoading}
                >
                  {avatarLoading ? "Création…" : "🎨 Générer son portrait"}
                </button>
                {avatar && (
                  <a className={styles.actionBtn} href={avatar} download="createur-ugc.jpg">
                    ⬇ Télécharger
                  </a>
                )}
              </div>
              {avatarLoading && (
                <div className={styles.loading}>
                  <span className={styles.spinner} /> Génération du portrait…
                </div>
              )}
              {avatar && <img className={styles.avatarImg} src={avatar} alt="Créateur UGC" />}
            </section>

            <section className={styles.card}>
              <h3 className={styles.sectionTitle}>🎞 Le storyboard</h3>
              <div className={styles.scenes}>
                {script.scenes.map((scene, i) => (
                  <article className={styles.scene} key={i}>
                    <div className={styles.sceneHead}>
                      <span className={styles.time}>{scene.temps}</span>
                      <span className={styles.role}>{scene.role}</span>
                    </div>

                    <p className={styles.voix}>« {scene.voix} »</p>
                    <p className={styles.meta}>
                      <strong>Plan :</strong> {scene.visuel}
                    </p>
                    <p className={styles.meta}>
                      <strong>Texte à l&apos;écran :</strong> {scene.texte_ecran}
                    </p>

                    <div className={styles.sceneActions}>
                      <button className={styles.smallBtn} onClick={() => lire(scene.voix)}>
                        🔊 Écouter
                      </button>
                      <button
                        className={styles.smallBtn}
                        onClick={() => genererVisuel(i)}
                        disabled={visuelEnCours !== null}
                      >
                        {visuelEnCours === i ? "Génération…" : "🖼 Générer le visuel"}
                      </button>
                      {visuels[i] && (
                        <a
                          className={styles.smallBtn}
                          href={visuels[i]}
                          download={`scene-${i + 1}.jpg`}
                        >
                          ⬇ Image
                        </a>
                      )}
                    </div>

                    {visuels[i] && (
                      <img className={styles.sceneImg} src={visuels[i]} alt={scene.visuel} />
                    )}
                  </article>
                ))}
              </div>

              <p className={styles.cta}>
                <strong>Appel à l&apos;action</strong>
                {script.cta}
              </p>
            </section>

            <section className={styles.card}>
              <h3 className={styles.sectionTitle}>🎙 La voix off</h3>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="voix">Voix</label>
                  <select id="voix" value={voix} onChange={(e) => setVoix(e.target.value)}>
                    <option value="femme">Voix féminine</option>
                    <option value="homme">Voix masculine</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Gratuit, sans clé</label>
                  <button
                    className={styles.actionBtn}
                    onClick={() => lire(texteVoixOff(script))}
                  >
                    🔊 Lire tout le script
                  </button>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={genererVoixOff}
                  disabled={audioLoading}
                >
                  {audioLoading ? "Génération…" : "🎙 Voix off IA (ElevenLabs)"}
                </button>
                {audio && (
                  <a className={styles.actionBtn} href={audio} download="voix-off.mp3">
                    ⬇ Télécharger l&apos;audio
                  </a>
                )}
              </div>

              {audio && <audio className={styles.audio} controls src={audio} />}
              {audioNote && <div className={styles.note}>{audioNote}</div>}
            </section>

            <section className={styles.card}>
              <h3 className={styles.sectionTitle}>🎥 La vidéo d&apos;accroche</h3>
              <p className={styles.note}>
                Anime la première scène en vidéo. Cette étape nécessite un jeton Replicate — le
                reste du studio fonctionne sans aucune clé.
              </p>
              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={genererVideo}
                  disabled={videoStatut === "en cours"}
                >
                  {videoStatut === "en cours" ? "Génération en cours…" : "🎬 Générer la vidéo"}
                </button>
                {videoUrl && (
                  <a className={styles.actionBtn} href={videoUrl} download="accroche-ugc.mp4">
                    ⬇ Télécharger
                  </a>
                )}
              </div>
              {videoStatut === "en cours" && (
                <div className={styles.loading}>
                  <span className={styles.spinner} /> La vidéo prend quelques minutes…
                </div>
              )}
              {videoUrl && <video className={styles.video} controls src={videoUrl} />}
              {videoErreur && <div className={styles.error}>{videoErreur}</div>}
            </section>

            <section className={styles.card}>
              <h3 className={styles.sectionTitle}>📣 La publication</h3>
              <p className={styles.legende}>{script.description_publication}</p>
              <div className={styles.tags}>
                {script.hashtags.map((h) => (
                  <span className={styles.tag} key={h}>
                    {h}
                  </span>
                ))}
              </div>
            </section>
          </div>
        )}

        <p className={styles.foot}>
          Mode gratuit : script et images sans clé API (Pollinations.ai) · Avec clés : Claude
          (script), FLUX (images), ElevenLabs (voix), WAN (vidéo) ·{" "}
          <a href="/">← Accueil</a>
        </p>
      </div>
    </main>
  );
}
