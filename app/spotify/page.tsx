"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./spotify.module.css";

type Source = "spotify" | "deezer";

type Artiste = {
  id: string;
  nom: string;
  image: string | null;
  genres: string[];
  popularite: number | null;
  auditeurs: number | null;
  url: string | null;
  source: Source;
};

type Titre = {
  id: string;
  nom: string;
  artiste: string;
  album: string | null;
  pochette: string | null;
  duree: number;
  extrait: string | null;
  embed: string | null;
  url: string | null;
  explicite: boolean;
  source: Source;
};

type Album = {
  id: string;
  titre: string;
  pochette: string | null;
  annee: string | null;
  type: string | null;
  pistes: number | null;
  url: string | null;
};

type Fiche = {
  artiste: Artiste;
  titres: Titre[];
  albums: Album[];
  source: Source;
  avertissement: string | null;
};

const EXEMPLES = ["Youssou N'Dour", "Burna Boy", "Aya Nakamura", "Fally Ipupa", "Tiakola", "Angélique Kidjo"];

const FAVORIS_KEY = "spotify.favoris";

type Favori = { id: string; nom: string; source: Source };

function lireFavoris(): Favori[] {
  try {
    const brut = localStorage.getItem(FAVORIS_KEY);
    return brut ? (JSON.parse(brut) as Favori[]) : [];
  } catch {
    return [];
  }
}

function duree(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function nombre(n: number): string {
  return n.toLocaleString("fr-FR");
}

export default function Spotify() {
  const [requete, setRequete] = useState("");
  const [artistes, setArtistes] = useState<Artiste[]>([]);
  const [titres, setTitres] = useState<Titre[]>([]);
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [avertissement, setAvertissement] = useState<string | null>(null);
  const [chargeRecherche, setChargeRecherche] = useState(false);
  const [chargeFiche, setChargeFiche] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [enLecture, setEnLecture] = useState<Titre | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setFavoris(lireFavoris());

    // Permet d'arriver depuis une autre page (/spotify?q=…).
    const depuisLien = new URLSearchParams(window.location.search).get("q");
    if (depuisLien) rechercher(depuisLien);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Un seul extrait à la fois : on coupe le précédent avant de lancer le suivant.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (enLecture?.extrait) {
      audio.src = enLecture.extrait;
      audio.play().catch(() => setErreur("Lecture de l'extrait impossible dans ce navigateur."));
    } else {
      audio.pause();
    }
  }, [enLecture]);

  function basculerFavori(artiste: Artiste) {
    setFavoris((prev) => {
      const suivant = prev.some((f) => f.id === artiste.id)
        ? prev.filter((f) => f.id !== artiste.id)
        : [{ id: artiste.id, nom: artiste.nom, source: artiste.source }, ...prev].slice(0, 12);
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
    setEnLecture(null);

    try {
      const res = await fetch(`/api/spotify?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);

      setArtistes(data.artistes ?? []);
      setTitres(data.titres ?? []);
      setSource(data.source ?? null);
      setAvertissement(data.avertissement ?? null);
      if (data.erreurDouce) setErreur(data.erreurDouce);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setChargeRecherche(false);
    }
  }

  async function ouvrirArtiste(id: string, src: Source) {
    setChargeFiche(true);
    setErreur(null);
    setEnLecture(null);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const res = await fetch(`/api/spotify?artiste=${encodeURIComponent(id)}&src=${src}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);

      setFiche(data);
      setSource(data.source ?? null);
      setAvertissement(data.avertissement ?? null);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setChargeFiche(false);
    }
  }

  function basculerLecture(t: Titre) {
    setEnLecture((prev) => (prev?.id === t.id ? null : t));
  }

  /** Une piste est écoutable soit par extrait MP3, soit par lecteur intégré. */
  function ligneTitre(t: Titre, rang?: number) {
    const actif = enLecture?.id === t.id;
    return (
      <li key={t.id} className={`${styles.piste} ${actif ? styles.pisteActive : ""}`}>
        {rang !== undefined && <span className={styles.rang}>{rang}</span>}

        {t.pochette ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.pochette} src={t.pochette} alt="" />
        ) : (
          <span className={`${styles.pochette} ${styles.pochetteVide}`}>♪</span>
        )}

        <span className={styles.pisteTexte}>
          <strong>
            {t.nom}
            {t.explicite && <span className={styles.explicite}>E</span>}
          </strong>
          <em>{t.album ?? t.artiste}</em>
        </span>

        <span className={styles.pisteDuree}>{duree(t.duree)}</span>

        {(t.extrait || t.embed) && (
          <button
            className={styles.lecture}
            onClick={() => basculerLecture(t)}
            aria-label={actif ? `Arrêter ${t.nom}` : `Écouter ${t.nom}`}
          >
            {actif ? "◼" : "▶"}
          </button>
        )}

        {t.url && (
          <a className={styles.lienPiste} href={t.url} target="_blank" rel="noopener noreferrer">
            ↗
          </a>
        )}
      </li>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.badge}>🎧 Explorateur musical</span>
          <h1>
            Cherchez un <span>artiste</span>, écoutez ses titres
          </h1>
          <p>
            Recherchez un artiste ou une chanson, découvrez ses titres phares, sa
            discographie et écoutez un extrait — directement depuis la page.
            Fonctionne sans aucune clé API grâce à Deezer, et bascule
            automatiquement sur l&apos;API Spotify officielle si vos clés sont
            renseignées.
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
            placeholder="Un artiste ou un titre (ex. Youssou N'Dour)"
            aria-label="Artiste ou titre à rechercher"
          />
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
            <span className={styles.pucesLabel}>⭐ Enregistrés :</span>
            {favoris.map((f) => (
              <button
                key={f.id}
                className={`${styles.puce} ${styles.puceFavori}`}
                onClick={() => ouvrirArtiste(f.id, f.source)}
              >
                {f.nom}
              </button>
            ))}
          </div>
        )}

        {source && (
          <p className={styles.moteur}>
            Moteur : <strong>{source === "spotify" ? "API Spotify" : "Deezer (mode gratuit)"}</strong>
            {source === "deezer" && !avertissement && (
              <>
                {" "}— ajoutez <code>SPOTIFY_CLIENT_ID</code> et <code>SPOTIFY_CLIENT_SECRET</code>{" "}
                pour passer sur Spotify.
              </>
            )}
          </p>
        )}

        {avertissement && <p className={styles.info}>{avertissement}</p>}
        {erreur && <p className={styles.erreur}>{erreur}</p>}
        {chargeFiche && <p className={styles.info}>Chargement de l&apos;artiste…</p>}

        {/* Lecteur intégré Spotify : utilisé quand aucun extrait MP3 n'existe. */}
        {enLecture && !enLecture.extrait && enLecture.embed && (
          <section className={styles.lecteur}>
            <iframe
              title={`Lecteur Spotify — ${enLecture.nom}`}
              src={enLecture.embed}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </section>
        )}

        {enLecture?.extrait && (
          <p className={styles.info}>
            ▶ Extrait de 30 s — <strong>{enLecture.nom}</strong> · {enLecture.artiste}{" "}
            <button className={styles.stop} onClick={() => setEnLecture(null)}>
              Arrêter
            </button>
          </p>
        )}

        <audio ref={audioRef} onEnded={() => setEnLecture(null)} hidden />

        {fiche && !chargeFiche && (
          <article className={styles.fiche}>
            <div className={styles.ficheHaut}>
              {fiche.artiste.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.portrait} src={fiche.artiste.image} alt={fiche.artiste.nom} />
              ) : (
                <div className={`${styles.portrait} ${styles.portraitVide}`}>🎤</div>
              )}

              <div className={styles.identite}>
                <h2>{fiche.artiste.nom}</h2>

                <div className={styles.metaLigne}>
                  {fiche.artiste.auditeurs !== null && (
                    <span className={styles.tag}>
                      {nombre(fiche.artiste.auditeurs)}{" "}
                      {fiche.artiste.source === "spotify" ? "abonnés" : "fans"}
                    </span>
                  )}
                  {fiche.artiste.popularite !== null && (
                    <span className={styles.tag}>Popularité {fiche.artiste.popularite}/100</span>
                  )}
                  <button className={styles.favoriBtn} onClick={() => basculerFavori(fiche.artiste)}>
                    {favoris.some((f) => f.id === fiche.artiste.id) ? "★ Enregistré" : "☆ Enregistrer"}
                  </button>
                  <a
                    className={styles.favoriBtn}
                    href={`/intel?nom=${encodeURIComponent(fiche.artiste.nom)}`}
                  >
                    ⚡ Analyser l&apos;actualité
                  </a>
                </div>

                {fiche.artiste.genres.length > 0 && (
                  <div className={styles.liens}>
                    {fiche.artiste.genres.map((g) => (
                      <span key={g} className={styles.lien}>
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {fiche.artiste.url && (
                  <div className={styles.liens}>
                    <a
                      className={styles.lien}
                      href={fiche.artiste.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ouvrir sur {fiche.artiste.source === "spotify" ? "Spotify" : "Deezer"} ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            {fiche.titres.length > 0 && (
              <section className={styles.bloc}>
                <h3>Titres phares</h3>
                <ul className={styles.pistes}>
                  {fiche.titres.map((t, i) => ligneTitre(t, i + 1))}
                </ul>
              </section>
            )}

            {fiche.albums.length > 0 && (
              <section className={styles.bloc}>
                <h3>Discographie</h3>
                <div className={styles.albums}>
                  {fiche.albums.map((a) => (
                    <a
                      key={a.id}
                      className={styles.album}
                      href={a.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {a.pochette ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.pochette} alt="" />
                      ) : (
                        <span className={styles.albumVide}>💿</span>
                      )}
                      <strong>{a.titre}</strong>
                      <em>
                        {[a.type, a.annee, a.pistes ? `${a.pistes} pistes` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </em>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}

        {!fiche && !chargeFiche && artistes.length > 0 && (
          <section className={styles.bloc}>
            <h3>Artistes</h3>
            <div className={styles.grilleArtistes}>
              {artistes.map((a) => (
                <button
                  key={a.id}
                  className={styles.carteArtiste}
                  onClick={() => ouvrirArtiste(a.id, a.source)}
                >
                  {a.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image} alt="" />
                  ) : (
                    <span className={styles.carteVide}>🎤</span>
                  )}
                  <strong>{a.nom}</strong>
                  {a.auditeurs !== null && (
                    <em>
                      {nombre(a.auditeurs)} {a.source === "spotify" ? "abonnés" : "fans"}
                    </em>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {!fiche && !chargeFiche && titres.length > 0 && (
          <section className={styles.bloc}>
            <h3>Titres</h3>
            <ul className={styles.pistes}>{titres.map((t) => ligneTitre(t))}</ul>
          </section>
        )}

        <footer className={styles.footer}>
          <a href="/" className={styles.retour}>
            ← Retour au studio
          </a>
          <p>
            Les extraits durent 30 secondes et sont diffusés par la plateforme
            elle-même (Deezer ou Spotify) : cette page ne stocke ni ne télécharge
            aucune musique. Pour écouter un titre en entier, ouvrez-le sur la
            plateforme.
          </p>
        </footer>
      </div>
    </div>
  );
}
