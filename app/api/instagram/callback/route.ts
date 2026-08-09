import { cookies } from "next/headers";
import {
  STATE_COOKIE,
  exchangeLongLived,
  fetchProfile,
  messageErreur,
  redirectUri,
  writeSession,
} from "../lib";

export const runtime = "nodejs";

// Retour d'Instagram après autorisation : on échange le code contre un jeton et on relie le compte.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const retour = (message: string) => Response.redirect(`${url.origin}/instagram?message=${encodeURIComponent(message)}`, 302);
  const erreur = (message: string) => Response.redirect(`${url.origin}/instagram?erreur=${encodeURIComponent(message)}`, 302);

  const refus = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (refus) return erreur(`Connexion annulée : ${refus}`);

  // Instagram ajoute un « #_ » à la fin du code, à retirer avant l'échange.
  const code = url.searchParams.get("code")?.replace(/#_$/, "");
  if (!code) return erreur("Instagram n'a pas renvoyé de code d'autorisation.");

  const jar = await cookies();
  const attendu = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);
  if (!attendu || attendu !== url.searchParams.get("state")) {
    return erreur("Session de connexion expirée ou invalide. Relance la connexion.");
  }

  try {
    const form = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID ?? "",
      client_secret: process.env.INSTAGRAM_APP_SECRET ?? "",
      grant_type: "authorization_code",
      redirect_uri: redirectUri(req),
      code,
    });

    const r = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      cache: "no-store",
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) return erreur(messageErreur(data, r.status));

    // L'API renvoie soit un objet à plat, soit { data: [ { … } ] } selon la version.
    const brut = (data?.data?.[0] ?? data) as { access_token?: string; user_id?: string | number };
    if (!brut?.access_token) return erreur("Instagram n'a pas renvoyé de jeton d'accès.");

    const long = await exchangeLongLived(brut.access_token);
    const profil = await fetchProfile(long.access_token);

    await writeSession({
      token: long.access_token,
      userId: String(profil.user_id ?? profil.id ?? brut.user_id ?? ""),
      username: profil.username,
      accountType: profil.account_type,
      picture: profil.profile_picture_url,
      expiresAt: Date.now() + (long.expires_in ?? 60 * 24 * 3600) * 1000,
    });

    return retour(`Compte @${profil.username ?? "instagram"} connecté.`);
  } catch (err) {
    return erreur((err as Error).message);
  }
}
