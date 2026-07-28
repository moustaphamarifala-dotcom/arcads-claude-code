"use client";

import { useEffect, useState } from "react";
import styles from "./personnes.module.css";

type Resultat = {
  titre: string;
  description: string | null;
  extrait: string | null;
  image: string | null;
  lang: "fr" | "en";
};

type Fiche = {
  titre: string;
  lang: "fr" | "en";
  description: string | null;
  biographie: string;
  image: string | null;
  urlWikipedia: string | null;
  urlWikidata: string | null;
  estPersonne: boolean;
  age: number | null;
  faits: { label: string; valeurs: string[] }[];
  listes: { label: string; valeurs: string[] }[];
  liens: { label: string; url: string }[];
  similaires: Resultat[];
};

const EXEMPLES = [
  "Romain Molina",
  "Sadio Mané",
  "Aliou Cissé",
  "Ousmane Sonko",
  "Angélique Kidjo",
  "Didier Drogba",
];

const FAVORIS_KEY = "personnes.favoris";

function lireFavoris(): string[] {
  try {
    const brut = localStorage.getItem(FAVORIS_KEY);
    return brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    return [];
  }
}

export default function Personnes() {
  const [requete, setRequete] = useState("");
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [chargeRecherche, setChargeRecherche] = useState(false);
  const [chargeFiche, setChargeFiche] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [favoris, setFavoris] = useState<string[]>([]);

  useEffect(() => {
    setFavoris(lireFavoris());
  }, []);

  function basculerFavori(nom: string) {
    setFavoris((prev) => {
      const suivant = prev.includes(nom)
        ? prev.filter((n) => n !== nom)
        : [nom, ...prev].slice(0, 12);
      try {
        localStorage.setItem(FAVORIS_KEY, JSON.stringify(suivant));
      } catch {
        /* stockage plein ou indisponible : sans conséquence */
      }
      return suivant;
    });
  }

  async function rechercher(terme?: string) {
    const q = (terme ?? requete).trim();
    if (!q || chargeRecherche) return;
    if (terme) setRequete(terme);

    setChargeRecherche(true);
    setErreur(null);
    setFiche(null);

    try {
      const res = await fetch(
        `/api/personnes?q=${encodeURIComponent(q)}&lang=${lang}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);

      setResultats(data.resultats);
      if (data.resultats.length === 0) {
        setErreur(`Aucune personnalité trouvée pour « ${q} ».`);
      } else if (data.resultats.length === 1) {
        ouvrirFiche(data.resultats[0].titre, data.resultats[0].lang);
      }
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setChargeRecherche(false);
    }
  }

  async function ouvrirFiche(titre: string, langue: "fr" | "en" = lang) {
    setChargeFiche(true);
    setErreur(null);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const res = await fetch(
        `/api/personnes?titre=${encodeURIComponent(titre)}&lang=${langue}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);
      setFiche(data.fiche);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setChargeFiche(false);
    }
  }

  const paragraphes = fiche?.biographie
    ? fiche.biographie.split("\n").map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.badge}>🔎 Fiches personnalités</span>
          <h1>
            Qui est <span>cette personne ?</span>
          </h1>
          <p>
            Cherchez une personnalité publique — journaliste, sportif, artiste,
            responsable politique — et obtenez sa biographie, son parcours, ses
            œuvres et ses comptes officiels. Sources : Wikipédia et Wikidata.
          </p>
        </header>

        <section className={styles.barre}>
          <input
            className={styles.champ}
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") rechercher();
            }}
            placeholder="Nom d'une personnalité (ex. Romain Molina)"
            aria-label="Nom de la personnalité à rechercher"
          />
          <select
            className={styles.select}
            value={lang}
            onChange={(e) => setLang(e.target.value as "fr" | "en")}
            aria-label="Langue de recherche"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
          <button
            className={styles.bouton}
            onClick={() => rechercher()}
            disabled={chargeRecherche || !requete.trim()}
          >
            {chargeRecherche ? "Recherche…" : "Rechercher"}
          </button>
        </section>

        <div className={styles.puces}>
          <span className={styles.pucesLabel}>Exemples :</span>
          {EXEMPLES.map((nom) => (
            <button key={nom} className={styles.puce} onClick={() => rechercher(nom)}>
              {nom}
            </button>
          ))}
        </div>

        {favoris.length > 0 && (
          <div className={styles.puces}>
            <span className={styles.pucesLabel}>⭐ Enregistrées :</span>
            {favoris.map((nom) => (
              <button
                key={nom}
                className={`${styles.puce} ${styles.puceFavori}`}
                onClick={() => ouvrirFiche(nom)}
              >
                {nom}
              </button>
            ))}
          </div>
        )}

        {erreur && <p className={styles.erreur}>{erreur}</p>}
        {chargeFiche && <p className={styles.info}>Chargement de la fiche…</p>}

        {fiche && !chargeFiche && (
          <article className={styles.fiche}>
            <div className={styles.ficheHaut}>
              {fiche.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.portrait} src={fiche.image} alt={fiche.titre} />
              ) : (
                <div className={`${styles.portrait} ${styles.portraitVide}`}>👤</div>
              )}

              <div className={styles.identite}>
                <h2>{fiche.titre}</h2>
                {fiche.description && <p className={styles.role}>{fiche.description}</p>}

                <div className={styles.metaLigne}>
                  {fiche.age !== null && (
                    <span className={styles.tag}>{fiche.age} ans</span>
                  )}
                  {!fiche.estPersonne && (
                    <span className={styles.tag}>Fiche non biographique</span>
                  )}
                  <button
                    className={styles.favoriBtn}
                    onClick={() => basculerFavori(fiche.titre)}
                  >
                    {favoris.includes(fiche.titre) ? "★ Enregistrée" : "☆ Enregistrer"}
                  </button>
                  <a
                    className={styles.favoriBtn}
                    href={`/intel?nom=${encodeURIComponent(fiche.titre)}`}
                  >
                    ⚡ Analyser l&apos;actualité
                  </a>
                </div>

                {fiche.liens.length > 0 && (
                  <div className={styles.liens}>
                    {fiche.liens.map((l) => (
                      <a
                        key={l.label}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.lien}
                      >
                        {l.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {fiche.faits.length > 0 && (
              <section className={styles.bloc}>
                <h3>En bref</h3>
                <dl className={styles.faits}>
                  {fiche.faits.map((f) => (
                    <div key={f.label} className={styles.fait}>
                      <dt>{f.label}</dt>
                      <dd>{f.valeurs.join(" · ")}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {paragraphes.length > 0 && (
              <section className={styles.bloc}>
                <h3>Biographie</h3>
                {paragraphes.map((p, i) => (
                  <p key={i} className={styles.para}>
                    {p}
                  </p>
                ))}
              </section>
            )}

            {fiche.listes.map((liste) => (
              <section key={liste.label} className={styles.bloc}>
                <h3>{liste.label}</h3>
                <ul className={styles.liste}>
                  {liste.valeurs.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </section>
            ))}

            <section className={styles.bloc}>
              <h3>Sources</h3>
              <div className={styles.liens}>
                {fiche.urlWikipedia && (
                  <a
                    href={fiche.urlWikipedia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.lien}
                  >
                    Article Wikipédia complet ↗
                  </a>
                )}
                {fiche.urlWikidata && (
                  <a
                    href={fiche.urlWikidata}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.lien}
                  >
                    Données Wikidata ↗
                  </a>
                )}
              </div>
            </section>

            {fiche.similaires.length > 0 && (
              <section className={styles.bloc}>
                <h3>Profils proches</h3>
                <div className={styles.similaires}>
                  {fiche.similaires.map((s) => (
                    <button
                      key={s.titre}
                      className={styles.similaire}
                      onClick={() => ouvrirFiche(s.titre, s.lang)}
                    >
                      {s.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image} alt="" />
                      ) : (
                        <span className={styles.similaireVide}>👤</span>
                      )}
                      <span>
                        <strong>{s.titre}</strong>
                        {s.description && <em>{s.description}</em>}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}

        {resultats.length > 1 && !fiche && !chargeFiche && (
          <section className={styles.resultats}>
            <h3 className={styles.resultatsTitre}>
              {resultats.length} résultats — choisissez la bonne personne
            </h3>
            {resultats.map((r) => (
              <button
                key={r.titre}
                className={styles.resultat}
                onClick={() => ouvrirFiche(r.titre, r.lang)}
              >
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt="" />
                ) : (
                  <span className={styles.resultatVide}>👤</span>
                )}
                <span className={styles.resultatTexte}>
                  <strong>{r.titre}</strong>
                  {r.description && <em>{r.description}</em>}
                  {r.extrait && <span>{r.extrait}</span>}
                </span>
              </button>
            ))}
          </section>
        )}

        <footer className={styles.footer}>
          <a href="/" className={styles.retour}>
            ← Retour au studio
          </a>
          <p>
            Fiches construites à partir de sources publiques (Wikipédia, Wikidata)
            et destinées aux personnalités publiques. Les informations peuvent être
            incomplètes ou datées : vérifiez toujours à la source avant publication.
          </p>
        </footer>
      </div>
    </div>
  );
}
