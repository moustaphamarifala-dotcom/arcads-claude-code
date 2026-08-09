import { cookies } from "next/headers";

// API « Instagram avec connexion Instagram » (comptes Professionnel / Créateur).
// Doc : https://developers.facebook.com/docs/instagram-platform
export const GRAPH = "https://graph.instagram.com";
export const GRAPH_VERSION = "v23.0";

export const SESSION_COOKIE = "ig_session";
export const STATE_COOKIE = "ig_oauth_state";

// Lecture (instagram_business_basic) + publication (instagram_business_content_publish)
export const SCOPES = "instagram_business_basic,instagram_business_content_publish";

export type Session = {
  token: string;
  userId: string;
  username?: string;
  accountType?: string;
  picture?: string;
  /** Date d'expiration du jeton, en millisecondes. */
  expiresAt?: number;
  /** true si le jeton a été collé à la main plutôt qu'obtenu par OAuth. */
  manuel?: boolean;
};

export function appConfigured() {
  return Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET);
}

/** URL de redirection déclarée dans l'app Meta. Déduite de la requête si non fournie. */
export function redirectUri(req: Request) {
  if (process.env.INSTAGRAM_REDIRECT_URI) return process.env.INSTAGRAM_REDIRECT_URI;
  const url = new URL(req.url);
  return `${url.origin}/api/instagram/callback`;
}

export async function readSession(): Promise<Session | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Session;
    return session.token && session.userId ? session : null;
  } catch {
    return null;
  }
}

export async function writeSession(session: Session) {
  const value = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 jours, comme le jeton longue durée
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Récupère le profil du compte relié à un jeton. */
export async function fetchProfile(token: string) {
  const fields = "user_id,username,account_type,profile_picture_url";
  const r = await fetch(
    `${GRAPH}/${GRAPH_VERSION}/me?fields=${fields}&access_token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(messageErreur(data, r.status));
  return data as {
    user_id?: string;
    id?: string;
    username?: string;
    account_type?: string;
    profile_picture_url?: string;
  };
}

/** Échange un jeton courte durée (1 h) contre un jeton longue durée (60 jours). */
export async function exchangeLongLived(shortToken: string) {
  const secret = process.env.INSTAGRAM_APP_SECRET ?? "";
  const r = await fetch(
    `${GRAPH}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
      secret,
    )}&access_token=${encodeURIComponent(shortToken)}`,
    { cache: "no-store" },
  );
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(messageErreur(data, r.status));
  return data as { access_token: string; expires_in: number };
}

/** Prolonge un jeton longue durée (possible dès 24 h et jusqu'à 60 jours après sa création). */
export async function refreshLongLived(token: string) {
  const r = await fetch(
    `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(messageErreur(data, r.status));
  return data as { access_token: string; expires_in: number };
}

/** Transforme une erreur de l'API Instagram en message clair, en français. */
export function messageErreur(data: unknown, status: number) {
  const err = (data as { error?: { message?: string; code?: number; error_user_msg?: string } } | null)?.error;
  const brut = err?.error_user_msg || err?.message;

  if (err?.code === 190 || status === 401) {
    return "Ta connexion Instagram a expiré. Reconnecte ton compte sur la page Instagram.";
  }
  if (err?.code === 4 || err?.code === 17 || status === 429) {
    return "Limite de publication Instagram atteinte (25 publications par 24 h). Réessaie plus tard.";
  }
  if (err?.code === 10 || err?.code === 200) {
    return `Autorisation refusée par Instagram. Vérifie que le compte est bien un compte Professionnel ou Créateur et que la permission de publication est accordée.${brut ? ` (${brut})` : ""}`;
  }
  if (brut) return `Instagram : ${brut}`;
  if (status === 400 || status === 403) {
    return `Instagram a refusé la requête (${status}) : le jeton est probablement invalide ou expiré.`;
  }
  return `Erreur Instagram (${status}).`;
}
