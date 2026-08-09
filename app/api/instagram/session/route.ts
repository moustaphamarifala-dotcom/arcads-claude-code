import {
  appConfigured,
  clearSession,
  fetchProfile,
  readSession,
  refreshLongLived,
  writeSession,
} from "../lib";

export const runtime = "nodejs";

const DIX_JOURS = 10 * 24 * 3600 * 1000;

// État de la connexion (et prolongation automatique du jeton s'il approche de l'expiration).
export async function GET() {
  const session = await readSession();
  if (!session) return Response.json({ configured: appConfigured(), connected: false });

  let { token, expiresAt } = session;

  if (!session.manuel && expiresAt && expiresAt - Date.now() < DIX_JOURS) {
    try {
      const long = await refreshLongLived(token);
      token = long.access_token;
      expiresAt = Date.now() + (long.expires_in ?? 60 * 24 * 3600) * 1000;
      await writeSession({ ...session, token, expiresAt });
    } catch {
      // Prolongation impossible : on garde le jeton actuel, l'utilisateur se reconnectera.
    }
  }

  return Response.json({
    configured: appConfigured(),
    connected: true,
    username: session.username,
    accountType: session.accountType,
    picture: session.picture,
    manuel: session.manuel ?? false,
    expiresAt,
  });
}

// Connexion manuelle : l'utilisateur colle un jeton d'accès Instagram.
export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({ token: null }));
  if (!token || typeof token !== "string") {
    return Response.json({ error: "Colle ton jeton d'accès Instagram." }, { status: 400 });
  }

  try {
    const profil = await fetchProfile(token.trim());
    const userId = String(profil.user_id ?? profil.id ?? "");
    if (!userId) {
      return Response.json(
        { error: "Ce jeton ne correspond à aucun compte Instagram Professionnel ou Créateur." },
        { status: 400 },
      );
    }

    await writeSession({
      token: token.trim(),
      userId,
      username: profil.username,
      accountType: profil.account_type,
      picture: profil.profile_picture_url,
      manuel: true,
    });

    return Response.json({ connected: true, username: profil.username, accountType: profil.account_type });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}

// Déconnexion : on oublie le jeton.
export async function DELETE() {
  await clearSession();
  return Response.json({ connected: false });
}
