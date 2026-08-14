import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Explorateur musical : artistes, titres et albums.
 *
 * Deux moteurs, choisis automatiquement :
 *   - MODE GRATUIT (aucune clé)  : Deezer, API publique, extraits de 30 s inclus.
 *   - MODE PREMIUM (clés Spotify): API Spotify officielle (SPOTIFY_CLIENT_ID +
 *     SPOTIFY_CLIENT_SECRET), avec genres, popularité et lecteur intégré.
 *
 * Les deux moteurs renvoient exactement la même forme de données afin que
 * l'interface n'ait jamais à savoir d'où vient le résultat.
 */

const MARCHE = process.env.SPOTIFY_MARKET?.trim() || "FR";

/* ------------------------------------------------------------------ */
/* Types partagés                                                      */
/* ------------------------------------------------------------------ */

type Source = "spotify" | "deezer";

type Artiste = {
  id: string;
  nom: string;
  image: string | null;
  genres: string[];
  popularite: number | null; // 0 à 100, uniquement côté Spotify
  auditeurs: number | null; // abonnés Spotify ou fans Deezer
  url: string | null;
  source: Source;
};

type Titre = {
  id: string;
  nom: string;
  artiste: string;
  album: string | null;
  pochette: string | null;
  duree: number; // en secondes
  extrait: string | null; // MP3 de 30 s, quand la plateforme en fournit un
  embed: string | null; // lecteur intégré Spotify
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

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

async function json(url: string, init?: RequestInit & { revalidate?: number }) {
  const { revalidate, ...reste } = init ?? {};
  const res = await fetch(url, {
    ...reste,
    headers: { Accept: "application/json", ...(reste.headers ?? {}) },
    next: revalidate === undefined ? undefined : { revalidate },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${new URL(url).host} a répondu ${res.status}${detail ? ` — ${detail.slice(0, 160)}` : ""}`);
  }
  return res.json();
}

/** Choisit l'image la plus proche de la largeur voulue. */
function meilleureImage(images: any[] | undefined, largeurCible = 320): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const triees = [...images].sort(
    (a, b) => Math.abs((a.width ?? 0) - largeurCible) - Math.abs((b.width ?? 0) - largeurCible),
  );
  return triees[0]?.url ?? null;
}

/* ------------------------------------------------------------------ */
/* Moteur Spotify (clés requises)                                      */
/* ------------------------------------------------------------------ */

function clesSpotify(): { id: string; secret: string } | null {
  const id = process.env.SPOTIFY_CLIENT_ID?.trim();
  const secret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  return id && secret ? { id, secret } : null;
}

// Le jeton Spotify vit une heure : on le garde en mémoire pour éviter
// une négociation OAuth à chaque recherche.
let jetonCache: { valeur: string; expire: number } | null = null;

async function jetonSpotify(): Promise<string> {
  if (jetonCache && Date.now() < jetonCache.expire) return jetonCache.valeur;

  const cles = clesSpotify();
  if (!cles) throw new Error("Clés Spotify absentes.");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${cles.id}:${cles.secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      res.status === 400 || res.status === 401
        ? "Identifiants Spotify refusés : vérifiez SPOTIFY_CLIENT_ID et SPOTIFY_CLIENT_SECRET."
        : `Spotify a répondu ${res.status} lors de l'authentification.`,
    );
  }

  const data = await res.json();
  // On retire 60 s de marge pour ne jamais présenter un jeton tout juste expiré.
  jetonCache = {
    valeur: data.access_token,
    expire: Date.now() + Math.max(0, (data.expires_in ?? 3600) - 60) * 1000,
  };
  return jetonCache.valeur;
}

async function apiSpotify(chemin: string, params: Record<string, string> = {}) {
  const url = new URL(`https://api.spotify.com/v1/${chemin}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  return json(url.toString(), {
    headers: { Authorization: `Bearer ${await jetonSpotify()}` },
    revalidate: 900,
  });
}

function artisteSpotify(a: any): Artiste {
  return {
    id: a.id,
    nom: a.name,
    image: meilleureImage(a.images, 320),
    genres: Array.isArray(a.genres) ? a.genres.slice(0, 6) : [],
    popularite: typeof a.popularity === "number" ? a.popularity : null,
    auditeurs: a.followers?.total ?? null,
    url: a.external_urls?.spotify ?? null,
    source: "spotify",
  };
}

function titreSpotify(t: any): Titre {
  return {
    id: t.id,
    nom: t.name,
    artiste: (t.artists ?? []).map((a: any) => a.name).join(", "),
    album: t.album?.name ?? null,
    pochette: meilleureImage(t.album?.images, 160),
    duree: Math.round((t.duration_ms ?? 0) / 1000),
    // Spotify ne fournit plus systématiquement d'extrait MP3 :
    // le lecteur intégré prend alors le relais.
    extrait: t.preview_url ?? null,
    embed: `https://open.spotify.com/embed/track/${t.id}?utm_source=generator`,
    url: t.external_urls?.spotify ?? null,
    explicite: Boolean(t.explicit),
    source: "spotify",
  };
}

function albumSpotify(a: any): Album {
  return {
    id: a.id,
    titre: a.name,
    pochette: meilleureImage(a.images, 240),
    annee: typeof a.release_date === "string" ? a.release_date.slice(0, 4) : null,
    type: a.album_group === "single" || a.album_type === "single" ? "Single" : "Album",
    pistes: a.total_tracks ?? null,
    url: a.external_urls?.spotify ?? null,
  };
}

async function rechercheSpotify(q: string) {
  const data = await apiSpotify("search", {
    q,
    type: "artist,track",
    market: MARCHE,
    limit: "8",
  });
  return {
    artistes: (data.artists?.items ?? []).map(artisteSpotify),
    titres: (data.tracks?.items ?? []).map(titreSpotify),
  };
}

async function ficheSpotify(id: string) {
  const [artiste, top, albums] = await Promise.all([
    apiSpotify(`artists/${id}`),
    apiSpotify(`artists/${id}/top-tracks`, { market: MARCHE }),
    apiSpotify(`artists/${id}/albums`, {
      include_groups: "album,single",
      market: MARCHE,
      limit: "12",
    }),
  ]);

  return {
    artiste: artisteSpotify(artiste),
    titres: (top.tracks ?? []).slice(0, 10).map(titreSpotify),
    albums: (albums.items ?? []).map(albumSpotify),
  };
}

/* ------------------------------------------------------------------ */
/* Moteur Deezer (aucune clé)                                          */
/* ------------------------------------------------------------------ */

async function apiDeezer(chemin: string, params: Record<string, string> = {}) {
  const url = new URL(`https://api.deezer.com/${chemin}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const data = await json(url.toString(), { revalidate: 900 });
  // Deezer signale ses erreurs dans un corps HTTP 200.
  if (data?.error) {
    throw new Error(data.error.message || "Deezer a refusé la requête.");
  }
  return data;
}

function artisteDeezer(a: any): Artiste {
  return {
    id: String(a.id),
    nom: a.name,
    image: a.picture_big ?? a.picture_medium ?? a.picture ?? null,
    genres: [], // Deezer n'expose pas de genre au niveau de l'artiste.
    popularite: null,
    auditeurs: a.nb_fan ?? null,
    url: a.link ?? null,
    source: "deezer",
  };
}

function titreDeezer(t: any): Titre {
  return {
    id: String(t.id),
    nom: t.title_short ?? t.title,
    artiste: t.artist?.name ?? "",
    album: t.album?.title ?? null,
    pochette: t.album?.cover_medium ?? t.album?.cover ?? null,
    duree: t.duration ?? 0,
    extrait: t.preview || null,
    embed: null,
    url: t.link ?? null,
    explicite: Boolean(t.explicit_lyrics),
    source: "deezer",
  };
}

function albumDeezer(a: any): Album {
  return {
    id: String(a.id),
    titre: a.title,
    pochette: a.cover_medium ?? a.cover ?? null,
    annee: typeof a.release_date === "string" ? a.release_date.slice(0, 4) : null,
    type: a.record_type === "single" ? "Single" : "Album",
    pistes: a.nb_tracks ?? null,
    url: a.link ?? null,
  };
}

async function rechercheDeezer(q: string) {
  const [artistes, titres] = await Promise.all([
    apiDeezer("search/artist", { q, limit: "8" }),
    apiDeezer("search", { q, limit: "8" }),
  ]);
  return {
    artistes: (artistes.data ?? []).map(artisteDeezer),
    titres: (titres.data ?? []).map(titreDeezer),
  };
}

async function ficheDeezer(id: string) {
  const [artiste, top, albums] = await Promise.all([
    apiDeezer(`artist/${id}`),
    apiDeezer(`artist/${id}/top`, { limit: "10" }),
    apiDeezer(`artist/${id}/albums`, { limit: "12" }),
  ]);

  return {
    artiste: artisteDeezer(artiste),
    titres: (top.data ?? []).map(titreDeezer),
    albums: (albums.data ?? []).map(albumDeezer),
  };
}

/* ------------------------------------------------------------------ */
/* Aiguillage : Spotify si possible, Deezer sinon                      */
/* ------------------------------------------------------------------ */

/**
 * Exécute l'action sur Spotify quand les clés sont présentes, et bascule
 * silencieusement sur Deezer si Spotify est indisponible — l'utilisateur
 * obtient toujours un résultat, accompagné d'un avertissement explicite.
 */
async function avecSecours<T>(
  sourceDemandee: Source | null,
  viaSpotify: () => Promise<T>,
  viaDeezer: () => Promise<T>,
): Promise<T & { source: Source; avertissement: string | null }> {
  const spotifyDisponible = clesSpotify() !== null;
  const utiliserSpotify = spotifyDisponible && sourceDemandee !== "deezer";

  if (utiliserSpotify) {
    try {
      return { ...(await viaSpotify()), source: "spotify", avertissement: null };
    } catch (err) {
      // Une fiche ouverte depuis un identifiant Spotify n'a pas d'équivalent
      // Deezer : mieux vaut remonter l'erreur que renvoyer un autre artiste.
      if (sourceDemandee === "spotify") throw err;
      return {
        ...(await viaDeezer()),
        source: "deezer",
        avertissement: `Spotify indisponible (${(err as Error).message}) — résultats fournis par Deezer.`,
      };
    }
  }

  return { ...(await viaDeezer()), source: "deezer", avertissement: null };
}

/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const artisteId = searchParams.get("artiste")?.trim();
  const srcBrute = searchParams.get("src");
  const src: Source | null =
    srcBrute === "spotify" || srcBrute === "deezer" ? srcBrute : null;

  try {
    if (artisteId) {
      const fiche = await avecSecours(
        src,
        () => ficheSpotify(artisteId),
        () => ficheDeezer(artisteId),
      );
      return NextResponse.json(fiche);
    }

    if (q) {
      const resultats = await avecSecours(
        src,
        () => rechercheSpotify(q),
        () => rechercheDeezer(q),
      );
      if (resultats.artistes.length === 0 && resultats.titres.length === 0) {
        return NextResponse.json({
          ...resultats,
          erreurDouce: `Aucun artiste ni titre trouvé pour « ${q} ».`,
        });
      }
      return NextResponse.json(resultats);
    }

    return NextResponse.json(
      { error: "Indiquez une recherche (paramètre q) ou un artiste (paramètre artiste)." },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Service musical injoignable pour le moment." },
      { status: 502 },
    );
  }
}
