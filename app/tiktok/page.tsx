"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./tiktok.module.css";
import { FAMILLES, remplir } from "./accroches";

type Mode = "idees" | "score" | "plan" | "accroches";

type Critere = { nom: string; note: number; commentaire: string };
type Analyse = {
  note: number;
  verdict: string;
  criteres: Critere[];
  corrections: string[];
  hooks: string[];
};

const MODES: { id: Mode; label: string; resume: string }[] = [
  {
    id: "idees",
    label: "💡 Idées de vidéos",
    resume: "5 concepts complets pour ta niche : accroche, script minuté, plan de fin, hashtags.",
  },
  {
    id: "score",
    label: "🎯 Score de viralité",
    resume: "Colle ton script : note sur 100, ce qui bloque, et trois accroches de remplacement.",
  },
  {
    id: "plan",
    label: "📅 Plan 7 jours",
    resume: "Une semaine de publication cohérente, avec ce qu'il faut regarder à la fin.",
  },
  {
    id: "accroches",
    label: "🪝 Accroches",
    resume: "40 structures d'accroches qui marchent, à remplir avec ton sujet. Sans IA, instantané.",
  },
];

const OBJECTIFS: { id: string; label: string }[] = [
  { id: "vues", label: "Faire des vues" },
  { id: "abonnes", label: "Gagner des abonnés" },
  { id: "communaute", label: "Faire réagir" },
  { id: "vendre", label: "Vendre" },
];

const EXEMPLES = [
  "couture et tissus bazin",
  "recettes rapides étudiantes",
  "musculation à la maison",
  "conseils pour auto-entrepreneurs",
];

/** Rendu Markdown minimal : titres, listes, gras et paragraphes. */
function Markdown({ texte }: { texte: string }) {
  const lignes = texte.split("\n");
  const blocs: React.ReactNode[] = [];
  let liste: string[] = [];

  const gras = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );

  const viderListe = () => {
    if (liste.length === 0) return;
    blocs.push(
      <ul key={`l${blocs.length}`} className={styles.mdListe}>
        {liste.map((item, i) => (
          <li key={i}>{gras(item)}</li>
        ))}
      </ul>,
    );
    liste = [];
  };

  for (const brute of lignes) {
    const ligne = brute.trim();

    if (!ligne) {
      viderListe();
    } else if (ligne.startsWith("#")) {
      viderListe();
      blocs.push(
        <h3 key={`h${blocs.length}`} className={styles.mdTitre}>
          {ligne.replace(/^#+\s*/, "")}
        </h3>,
      );
    } else if (/^[-*]\s+/.test(ligne) || /^\d+\.\s+/.test(ligne)) {
      liste.push(ligne.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""));
    } else {
      viderListe();
      blocs.push(
        <p key={`p${blocs.length}`} className={styles.mdPara}>
          {gras(ligne)}
        </p>,
      );
    }
  }
  viderListe();

  return <>{blocs}</>;
}

/** Bouton de copie qui confirme lui-même, sans alerte ni notification. */
function Copier({ texte, libelle = "Copier" }: { texte: string; libelle?: string }) {
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    if (!copie) return;
    const t = setTimeout(() => setCopie(false), 1600);
    return () => clearTimeout(t);
  }, [copie]);

  return (
    <button
      className={styles.copier}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texte);
          setCopie(true);
        } catch {
          setCopie(false);
        }
      }}
    >
      {copie ? "✓ Copié" : libelle}
    </button>
  );
}

function Jauge({ note }: { note: number }) {
  const niveau = note >= 75 ? "haut" : note >= 50 ? "moyen" : "bas";
  const verdict =
    note >= 75
      ? "Prête à tourner"
      : note >= 50
        ? "Bonne base, l'accroche à retravailler"
        : "À réécrire avant de tourner";

  return (
    <div className={`${styles.jauge} ${styles[`jauge_${niveau}`]}`}>
      <div className={styles.jaugeNote}>
        <strong>{note}</strong>
        <span>/100</span>
      </div>
      <div className={styles.jaugeBarre}>
        <div className={styles.jaugeRemplie} style={{ width: `${note}%` }} />
      </div>
      <p className={styles.jaugeVerdict}>{verdict}</p>
    </div>
  );
}

export default function StudioTikTok() {
  const [mode, setMode] = useState<Mode>("idees");
  const [niche, setNiche] = useState("");
  const [objectif, setObjectif] = useState("vues");
  const [format, setFormat] = useState("face caméra, au téléphone, sans matériel");
  const [script, setScript] = useState("");

  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<string | null>(null);
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [moteur, setMoteur] = useState<string | null>(null);

  const [famille, setFamille] = useState(FAMILLES[0].id);
  const familleActive = useMemo(
    () => FAMILLES.find((f) => f.id === famille) ?? FAMILLES[0],
    [famille],
  );

  function changerMode(cible: Mode) {
    setMode(cible);
    setErreur(null);
    setResultat(null);
    setAnalyse(null);
  }

  async function generer(sujet?: string) {
    if (charge) return;
    const cible = (sujet ?? niche).trim();
    if (sujet) setNiche(sujet);

    if (mode === "score" && !script.trim()) {
      setErreur("Collez d'abord le script ou l'accroche à analyser.");
      return;
    }
    if (mode !== "score" && !cible) {
      setErreur("Indiquez votre niche ou votre sujet.");
      return;
    }

    setCharge(true);
    setErreur(null);
    setResultat(null);
    setAnalyse(null);

    try {
      const res = await fetch("/api/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          niche: cible,
          objectif,
          format,
          texte: script,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);

      setResultat(data.resultat ?? null);
      setAnalyse(data.analyse ?? null);
      setMoteur(data.moteur);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setCharge(false);
    }
  }

  const modeActif = MODES.find((m) => m.id === mode)!;

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.badge}>🎬 Studio TikTok</span>
          <h1>
            Des vidéos <span>qu&apos;on regarde jusqu&apos;au bout</span>
          </h1>
          <p>
            Personne ne peut te garantir une vidéo virale — ni cette application, ni
            personne d&apos;autre. Ce qu&apos;elle fait, c&apos;est travailler les trois
            choses sur lesquelles tu as vraiment la main : une accroche qui retient dès
            la première seconde, un déroulé qui donne envie de rester, et une fin qui
            fait commenter. Le reste, c&apos;est de la régularité.
          </p>
        </header>

        <nav className={styles.modes} aria-label="Outil">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`${styles.mode} ${mode === m.id ? styles.modeActif : ""}`}
              onClick={() => changerMode(m.id)}
            >
              <strong>{m.label}</strong>
              <span>{m.resume}</span>
            </button>
          ))}
        </nav>

        {/* ---------------- Bibliothèque d'accroches ---------------- */}

        {mode === "accroches" && (
          <section className={styles.bloc}>
            <label className={styles.champLabel} htmlFor="sujet-accroche">
              Ton sujet — il remplace le trou dans chaque accroche
            </label>
            <input
              id="sujet-accroche"
              className={styles.champ}
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="la couture bazin, le café de spécialité, la prépa maths…"
            />

            <div className={styles.puces}>
              {FAMILLES.map((f) => (
                <button
                  key={f.id}
                  className={`${styles.puce} ${famille === f.id ? styles.puceActive : ""}`}
                  onClick={() => setFamille(f.id)}
                >
                  {f.titre}
                </button>
              ))}
            </div>

            <p className={styles.pourquoi}>{familleActive.pourquoi}</p>

            <ul className={styles.accroches}>
              {familleActive.modeles.map((modele) => {
                const phrase = remplir(modele, niche);
                return (
                  <li key={modele}>
                    <span>{phrase}</span>
                    <Copier texte={phrase} />
                  </li>
                );
              })}
            </ul>

            <p className={styles.note}>
              Ces structures ne remplacent pas le fond de ta vidéo : une bonne accroche
              sur une vidéo vide fait juste partir les gens un peu plus tard. Choisis
              celle qui correspond à ce que tu as vraiment à montrer.
            </p>
          </section>
        )}

        {/* ---------------- Formulaires IA ---------------- */}

        {mode !== "accroches" && (
          <section className={styles.bloc}>
            {mode === "score" ? (
              <>
                <label className={styles.champLabel} htmlFor="script">
                  Ton script, ou juste ton accroche
                </label>
                <textarea
                  id="script"
                  className={styles.zone}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder={
                    "Colle ici ce que tu comptes dire.\n\nExemple : « Salut à tous, aujourd'hui je vais vous parler de ma routine du matin. Alors déjà je me lève à 6h… »"
                  }
                  rows={7}
                />
                <label className={styles.champLabel} htmlFor="niche-score">
                  Ta niche <span className={styles.optionnel}>— optionnel, ça affine l&apos;analyse</span>
                </label>
                <input
                  id="niche-score"
                  className={styles.champ}
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="développement personnel, cuisine, sport…"
                />
              </>
            ) : (
              <>
                <label className={styles.champLabel} htmlFor="niche">
                  Ta niche, ou le sujet de ton compte
                </label>
                <input
                  id="niche"
                  className={styles.champ}
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") generer();
                  }}
                  placeholder="couture bazin, finance perso, recettes rapides…"
                />

                <div className={styles.puces}>
                  <span className={styles.pucesLabel}>Exemples :</span>
                  {EXEMPLES.map((ex) => (
                    <button key={ex} className={styles.puce} onClick={() => setNiche(ex)}>
                      {ex}
                    </button>
                  ))}
                </div>

                <label className={styles.champLabel}>Ce que tu cherches en priorité</label>
                <div className={styles.puces}>
                  {OBJECTIFS.map((o) => (
                    <button
                      key={o.id}
                      className={`${styles.puce} ${objectif === o.id ? styles.puceActive : ""}`}
                      onClick={() => setObjectif(o.id)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                <label className={styles.champLabel} htmlFor="format">
                  Comment tu peux tourner
                </label>
                <input
                  id="format"
                  className={styles.champ}
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="face caméra, voix off sur des images, mains seulement…"
                />
              </>
            )}

            <button
              className={styles.bouton}
              onClick={() => generer()}
              disabled={charge}
            >
              {charge ? "Génération…" : modeActif.label.replace(/^\S+\s/, "→ ")}
            </button>

            {erreur && <p className={styles.erreur}>{erreur}</p>}

            {charge && (
              <p className={styles.info}>
                Écriture en cours — compte une trentaine de secondes.
              </p>
            )}
          </section>
        )}

        {/* ---------------- Résultat : score ---------------- */}

        {analyse && !charge && (
          <article className={styles.resultat}>
            <div className={styles.resultatHaut}>
              <h2>Analyse de ton script</h2>
              <span className={styles.tag}>
                analyse {moteur === "Claude" ? "Claude" : "gratuite"}
              </span>
            </div>

            <Jauge note={analyse.note} />

            {analyse.verdict && <p className={styles.verdict}>{analyse.verdict}</p>}

            <ul className={styles.criteres}>
              {analyse.criteres.map((c) => (
                <li key={c.nom}>
                  <div className={styles.critereHaut}>
                    <strong>{c.nom}</strong>
                    <span>{c.note}/20</span>
                  </div>
                  <div className={styles.critereBarre}>
                    <div
                      className={styles.critereRemplie}
                      style={{ width: `${(c.note / 20) * 100}%` }}
                    />
                  </div>
                  <p>{c.commentaire}</p>
                </li>
              ))}
            </ul>

            {analyse.corrections.length > 0 && (
              <section className={styles.sousBloc}>
                <h3>À corriger en priorité</h3>
                <ol className={styles.corrections}>
                  {analyse.corrections.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ol>
              </section>
            )}

            {analyse.hooks.length > 0 && (
              <section className={styles.sousBloc}>
                <h3>Trois accroches de remplacement</h3>
                <ul className={styles.accroches}>
                  {analyse.hooks.map((h, i) => (
                    <li key={i}>
                      <span>{h}</span>
                      <Copier texte={h} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        )}

        {/* ---------------- Résultat : texte ---------------- */}

        {resultat && !charge && (
          <article className={styles.resultat}>
            <div className={styles.resultatHaut}>
              <h2>{mode === "plan" ? "Ta semaine" : "Tes concepts"}</h2>
              <span className={styles.tag}>
                <Copier texte={resultat} libelle="Tout copier" />
              </span>
            </div>
            <div className={styles.md}>
              <Markdown texte={resultat} />
            </div>
          </article>
        )}

        <footer className={styles.footer}>
          <a href="/" className={styles.retour}>
            ← Retour au studio
          </a>
          <p>
            Les idées et analyses de cette page sont produites par une IA : ce sont des
            propositions de départ, pas des vérités. Vérifie toujours qu&apos;une idée te
            ressemble et que tu peux la tenir avant de la tourner — une vidéo qui sonne
            faux se voit tout de suite. Et respecte les règles de TikTok : pas de contenu
            trompeur, pas de vues achetées.
          </p>
        </footer>
      </div>
    </div>
  );
}
