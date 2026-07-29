"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Markdown from "../components/Markdown";
import styles from "./dossier.module.css";

type Article = {
  titre: string;
  source: string;
  date: string | null;
  jour: string | null;
  url: string;
  angle: string;
};

type Theme = {
  mots: string[];
  articles: Article[];
  sources: string[];
  niveau: "Convergent" | "Rapporté" | "Source unique";
};

type Jour = { jour: string; libelle: string; articles: Article[] };

type Signal = {
  type: "contradiction" | "source-unique" | "sans-date";
  message: string;
  articles: Article[];
};

type Fiche = {
  titre: string;
  description: string | null;
  biographie: string;
  image: string | null;
  urlWikipedia: string | null;
  urlWikidata: string | null;
  age: number | null;
  faits: { label: string; valeurs: string[] }[];
  liens: { label: string; url: string }[];
};

type Dossier = {
  nom: string;
  fiche: Fiche | null;
  articles: Article[];
  angles: string[];
  themes: Theme[];
  chronologie: Jour[];
  signaux: Signal[];
  synthese: string;
  moteur: "Claude" | "gratuit";
};

const EXEMPLES = ["Aliko Dangote", "Orange Mali", "Kylian Mbappé", "Ousmane Sonko"];

const CLASSES_NIVEAU: Record<Theme["niveau"], string> = {
  Convergent: styles.niveauSolide,
  "Rapporté": styles.niveauMoyen,
  "Source unique": styles.niveauFaible,
};

const ICONES_SIGNAL: Record<Signal["type"], string> = {
  contradiction: "⚠️",
  "source-unique": "◐",
  "sans-date": "🕗",
};

export default function DossierPage() {
  const [nom, setNom] = useState("");
  const [focus, setFocus] = useState("");
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);

  // Permet d'arriver depuis une fiche personnalité (/dossier?nom=…).
  useEffect(() => {
    const depuisFiche = new URLSearchParams(window.location.search).get("nom");
    if (depuisFiche) setNom(depuisFiche);
  }, []);

  async function construire(sujet?: string) {
    const q = (sujet ?? nom).trim();
    if (!q || charge) return;
    if (sujet) setNom(sujet);

    setCharge(true);
    setErreur(null);
    setDossier(null);

    try {
      const res = await fetch("/api/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: q, focus: focus.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);
      setDossier(data as Dossier);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setCharge(false);
    }
  }

  const convergents = dossier?.themes.filter((t) => t.niveau === "Convergent").length ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.badge}>🗂️ Dossier — tout le public, recoupé</span>
          <h1>
            Ce qui est déjà public, <span>rassemblé et trié</span>
          </h1>
          <p>
            Entrez un nom de personnalité ou d&apos;organisation. L&apos;app
            interroge Wikipédia, Wikidata et plusieurs angles de la presse
            francophone et internationale, fusionne les résultats, puis compte
            combien de médias distincts rapportent chaque chose. Ce qui ressort :
            ce qui est confirmé de plusieurs côtés, ce qui ne tient qu&apos;à une
            seule source, et ce qui se contredit.
          </p>
        </header>

        <section className={styles.barre}>
          <input
            className={styles.champ}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") construire();
            }}
            placeholder="Une personnalité, une entreprise, une institution…"
            aria-label="Sujet du dossier"
          />
          <input
            className={`${styles.champ} ${styles.champFocus}`}
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") construire();
            }}
            placeholder="Angle (optionnel) : contrat, procès…"
            aria-label="Angle de recherche optionnel"
          />
          <button
            className={styles.bouton}
            onClick={() => construire()}
            disabled={charge || !nom.trim()}
          >
            {charge ? "Constitution…" : "Constituer le dossier"}
          </button>
        </section>

        <p className={styles.aide}>
          L&apos;angle est facultatif : il ajoute une recherche ciblée en plus des
          trois angles interrogés systématiquement.
        </p>

        <div className={styles.puces}>
          <span className={styles.pucesLabel}>Exemples :</span>
          {EXEMPLES.map((ex) => (
            <button key={ex} className={styles.puce} onClick={() => construire(ex)}>
              {ex}
            </button>
          ))}
        </div>

        {erreur && <p className={styles.erreur}>{erreur}</p>}

        {charge && (
          <p className={styles.info}>
            Interrogation de l&apos;encyclopédie et de plusieurs angles de presse,
            puis recoupement et synthèse — comptez une trentaine de secondes.
          </p>
        )}

        {dossier && !charge && (
          <>
            {/* Identité ------------------------------------------------ */}
            {dossier.fiche ? (
              <section className={styles.identite}>
                {dossier.fiche.image && (
                  <img
                    className={styles.portrait}
                    src={dossier.fiche.image}
                    alt={dossier.fiche.titre}
                  />
                )}
                <div className={styles.identiteCorps}>
                  <h2>{dossier.fiche.titre}</h2>
                  {dossier.fiche.description && (
                    <p className={styles.identiteDesc}>{dossier.fiche.description}</p>
                  )}

                  <div className={styles.faits}>
                    {dossier.fiche.age !== null && (
                      <span className={styles.fait}>
                        <strong>Âge</strong> · {dossier.fiche.age} ans
                      </span>
                    )}
                    {dossier.fiche.faits.map((f) => (
                      <span key={f.label} className={styles.fait}>
                        <strong>{f.label}</strong> · {f.valeurs.join(", ")}
                      </span>
                    ))}
                  </div>

                  <div className={styles.liens}>
                    {dossier.fiche.urlWikipedia && (
                      <a href={dossier.fiche.urlWikipedia} target="_blank" rel="noopener noreferrer">
                        Wikipédia ↗
                      </a>
                    )}
                    {dossier.fiche.liens.map((l) => (
                      <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer">
                        {l.label} ↗
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <p className={styles.sansFiche}>
                Aucune page encyclopédique pour ce sujet — le dossier ne repose
                donc que sur la presse. Les faits d&apos;identité (parcours,
                fonctions, dates) ne sont pas vérifiés ici.
              </p>
            )}

            {/* Synthèse ------------------------------------------------ */}
            <article className={styles.bloc}>
              <div className={styles.blocHaut}>
                <h2>Synthèse</h2>
                <span className={styles.tag}>
                  {dossier.articles.length} articles · {dossier.angles.length} angles ·{" "}
                  {dossier.moteur === "Claude" ? "Claude" : "moteur gratuit"}
                </span>
              </div>
              <Markdown
                texte={dossier.synthese}
                classes={{
                  titre: styles.mdTitre,
                  para: styles.mdPara,
                  liste: styles.mdListe,
                }}
              />
            </article>

            {/* Recoupement -------------------------------------------- */}
            {dossier.themes.length > 0 && (
              <section className={styles.bloc}>
                <div className={styles.blocHaut}>
                  <h2>Recoupement des sources</h2>
                  <span className={styles.tag}>
                    {convergents} sujet(s) confirmé(s) par 3 médias ou plus
                  </span>
                </div>
                <p className={styles.blocNote}>
                  Chaque sujet est regroupé à partir des mots partagés entre les
                  titres, puis étiqueté selon le nombre de <strong>médias
                  distincts</strong> qui le traitent. Ce comptage est calculé sur
                  les sources listées, pas produit par l&apos;IA.
                </p>

                {dossier.themes.slice(0, 10).map((theme, i) => (
                  <div key={i} className={styles.theme}>
                    <div className={styles.themeHaut}>
                      <span className={`${styles.niveau} ${CLASSES_NIVEAU[theme.niveau]}`}>
                        {theme.niveau}
                      </span>
                      <span className={styles.themeMots}>{theme.mots.join(" · ")}</span>
                      <span className={styles.themeSources}>
                        {theme.sources.length} média(s) : {theme.sources.join(", ")}
                      </span>
                    </div>
                    <ul className={styles.themeArticles}>
                      {theme.articles.slice(0, 5).map((a, j) => (
                        <li key={j}>
                          <a href={a.url} target="_blank" rel="noopener noreferrer">
                            {a.titre}
                          </a>
                          <em>
                            {a.source}
                            {a.date ? ` · ${a.date}` : ""}
                          </em>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}

            {/* Signaux ------------------------------------------------- */}
            {dossier.signaux.length > 0 && (
              <section className={styles.bloc}>
                <h2>À vérifier de près</h2>
                <p className={styles.blocNote}>
                  Des alertes de lecture, pas des conclusions : un démenti dans un
                  titre signale que la question est disputée, pas qui a raison.
                </p>
                {dossier.signaux.map((s, i) => (
                  <div key={i} className={styles.signal}>
                    <span className={styles.signalIcone}>{ICONES_SIGNAL[s.type]}</span>
                    <span>{s.message}</span>
                  </div>
                ))}
              </section>
            )}

            {/* Chronologie --------------------------------------------- */}
            {dossier.chronologie.length > 0 && (
              <section className={styles.bloc}>
                <h2>Chronologie</h2>
                <p className={styles.blocNote}>
                  Les articles datés, du plus récent au plus ancien.
                </p>
                <ul className={styles.chrono}>
                  {dossier.chronologie.slice(0, 14).map((jour) => (
                    <li key={jour.jour} className={styles.chronoJour}>
                      <span className={styles.chronoDate}>{jour.libelle}</span>
                      <ul className={styles.chronoListe}>
                        {jour.articles.map((a, j) => (
                          <li key={j}>
                            <a href={a.url} target="_blank" rel="noopener noreferrer">
                              {a.titre}
                            </a>{" "}
                            <em>— {a.source}</em>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Sources ------------------------------------------------- */}
            <section className={`${styles.bloc} ${styles.sources}`}>
              <h2>Toutes les sources ({dossier.articles.length})</h2>
              <p className={styles.blocNote}>
                Angles interrogés : {dossier.angles.join(", ")}.
              </p>
              <ol>
                {dossier.articles.map((a, i) => (
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
          </>
        )}

        <footer className={styles.footer}>
          <a href="/personnes" className={styles.retour}>
            ← Fiches personnalités
          </a>
          <a href="/intel" className={styles.retour}>
            ⚡ Intel
          </a>
          <p>
            Ce dossier ne consulte que des sources publiques : Wikipédia, Wikidata
            et les titres de presse indexés par Google Actualités. Il ne dispose
            d&apos;aucune donnée privée et n&apos;a de sens que pour des
            personnalités publiques et des organisations. Un titre de presse
            n&apos;est pas un fait vérifié : remontez à la source avant de
            reprendre ou de publier quoi que ce soit.
          </p>
        </footer>
      </div>
    </div>
  );
}
