import { cookies } from "next/headers";
import { STATE_COOKIE, SCOPES, appConfigured, redirectUri } from "../lib";

export const runtime = "nodejs";

// Démarre la connexion : redirige l'utilisateur vers la page d'autorisation Instagram.
export async function GET(req: Request) {
  if (!appConfigured()) {
    return Response.json(
      {
        error:
          "Connexion automatique indisponible : ajoute INSTAGRAM_APP_ID et INSTAGRAM_APP_SECRET dans tes variables d'environnement. Tu peux sinon coller un jeton d'accès à la main sur la page Instagram.",
      },
      { status: 400 },
    );
  }

  // Jeton anti-CSRF : on le compare au retour d'Instagram.
  const state = crypto.randomUUID();
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID ?? "",
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: SCOPES,
    state,
  });

  return Response.redirect(`https://www.instagram.com/oauth/authorize?${params}`, 302);
}
