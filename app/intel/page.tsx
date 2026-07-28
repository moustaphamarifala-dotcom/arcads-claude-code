"use client";

import { useEffect, useState } from "react";
import styles from "./intel.module.css";

type Article = {
  titre: string;
  source: string;
  date: string | null;
  url: string;
};

type Grille = "mercato" | "enquete";

const GRILLES: { id: Grille; label: string; resume: string }[] = [
  {
    id: "mercato",
    label: "⚽ Mercato",
    resume:
      "État du dossier, qui pousse, ce qui est confirmé ou non, et le degré de solidité de l'info.",
  },
  {
    id: "enquete",
    label: "🕵️ Investigation",
    resume:
      "Qui décide, qui paie, ce que les sources ne disent pas, et les questions qui restent à poser.",
  },
];

const EXEMPLES = ["Fabrizio Romano", "Romain Molina", "Kylian Mbappé", "FSF Sénégal"];

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
      const titre = ligne.replace(/^#+\s*/, "");
      blocs.push(
        <h3 key={`h${blocs.length}`} className={styles.mdTitre}>
          {titre}
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

export default function Intel() {
  const [nom, setNom] = useState("");
  const [grille, setGrille] = useState<Grille>("mercato");
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [analyse, setAnalyse] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [moteur, setMoteur] = useState<string | null>(null);

  // Permet d'arriver depuis une fiche personnalité (/intel?nom=…).
  useEffect(() => {
    const depuisFiche = new URLSearchParams(window.location.search).get("nom");
    if (depuisFiche) setNom(depuisFiche);
  }, []);

  async function analyser(sujet?: string, cible?: Grille) {
    const cible2 = cible ?? grille;
    const q = (sujet ?? nom).trim();
    if (!q || charge) return;
    if (sujet) setNom(sujet);
    if (cible) setGrille(cible);

    setCharge(true);
    setErreur(null);
    setAnalyse(null);
    setArticles([]);

    try {
      const res = await fetch("/api/intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: q, grille: cible2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);

      setAnalyse(data.analyse);
      setArticles(data.articles);
      setMoteur(data.moteur);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setCharge(false);
    }
  }

  const grilleActive = GRILLES.find((g) => g.id === grille)!;

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.badge}>⚡ Intel — revue de presse analysée</span>
          <h1>
            L&apos;actualité, <span>décryptée</span>
          </h1>
          <p>
            Entrez un nom : l&apos;app rassemble les articles récents de la presse,
            puis les analyse selon la grille de lecture que vous choisissez — celle
            du mercato ou celle de l&apos;enquête. Tout part d&apos;articles réels,
            et chaque source reste consultable en bas de page.
          </p>
        </header>

        <section className={styles.barre}>
          <input
            className={styles.champ}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") analyser();
            }}
            placeholder="Un joueur, un club, un dirigeant, une fédération…"
            aria-label="Sujet à analyser"
          />
          <button
            className={styles.bouton}
            onClick={() => analyser()}
            disabled={charge || !nom.trim()}
          >
            {charge ? "Analyse…" : "Analyser"}
          </button>
        </section>

        <div className={styles.grilles}>
          {GRILLES.map((g) => (
            <button
              key={g.id}
              className={`${styles.grille} ${grille === g.id ? styles.grilleActive : ""}`}
              onClick={() => setGrille(g.id)}
            >
              <strong>{g.label}</strong>
              <span>{g.resume}</span>
            </button>
          ))}
        </div>

        <div className={styles.puces}>
          <span className={styles.pucesLabel}>Exemples :</span>
          {EXEMPLES.map((ex) => (
            <button key={ex} className={styles.puce} onClick={() => analyser(ex)}>
              {ex}
            </button>
          ))}
        </div>

        {erreur && <p className={styles.erreur}>{erreur}</p>}

        {charge && (
          <p className={styles.info}>
            Lecture de la presse et analyse en cours — comptez une trentaine de
            secondes.
          </p>
        )}

        {analyse && !charge && (
          <article className={styles.resultat}>
            <div className={styles.resultatHaut}>
              <h2>
                {nom} — {grilleActive.label}
              </h2>
              <span className={styles.tag}>
                {articles.length} articles · analyse{" "}
                {moteur === "Claude" ? "Claude" : "gratuite"}
              </span>
            </div>

            <div className={styles.md}>
              <Markdown texte={analyse} />
            </div>

            <section className={styles.sources}>
              <h3>Les sources utilisées</h3>
              <ol>
                {articles.map((a, i) => (
                  <li key={i}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer">
                      {a.titre}
                    </a>
                    <em>
                      {a.source}
                      {a.date ? ` · ${a.date}` : ""}
                    </em>
                  </li>
                ))}
              </ol>
            </section>
          </article>
        )}

        <footer className={styles.footer}>
          <a href="/personnes" className={styles.retour}>
            ← Fiches personnalités
          </a>
          <p>
            Cette analyse est produite par une IA à partir de titres de presse
            publics. Elle résume et questionne des articles existants — elle
            n&apos;enquête pas, ne révèle rien et n&apos;est le travail
            d&apos;aucun journaliste réel. Vérifiez chaque élément à la source
            avant de le reprendre ou de le publier.
          </p>
        </footer>
      </div>
    </div>
  );
}
