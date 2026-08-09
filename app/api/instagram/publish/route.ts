import { GRAPH, GRAPH_VERSION, messageErreur, readSession } from "../lib";

export const runtime = "nodejs";
export const maxDuration = 300;

type Format = "photo" | "reel" | "story";

const LEGENDE_MAX = 2200;

async function graphPost(chemin: string, params: Record<string, string>) {
  const r = await fetch(`${GRAPH}/${GRAPH_VERSION}/${chemin}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
    cache: "no-store",
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(messageErreur(data, r.status));
  return data as Record<string, string>;
}

async function graphGet(chemin: string, params: Record<string, string>) {
  const r = await fetch(`${GRAPH}/${GRAPH_VERSION}/${chemin}?${new URLSearchParams(params)}`, {
    cache: "no-store",
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(messageErreur(data, r.status));
  return data as Record<string, string>;
}

const patiente = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Les vidéos sont encodées par Instagram : on attend que le conteneur soit prêt. */
async function attendreConteneur(id: string, token: string) {
  for (let essai = 0; essai < 40; essai++) {
    const { status_code: etat } = await graphGet(id, { fields: "status_code", access_token: token });
    if (etat === "FINISHED") return;
    if (etat === "ERROR") throw new Error("Instagram n'a pas réussi à traiter cette vidéo. Vérifie le format (MP4/MOV, H.264 + AAC).");
    if (etat === "EXPIRED") throw new Error("Le délai de publication a expiré. Relance la publication.");
    await patiente(essai < 5 ? 3000 : 6000);
  }
  throw new Error("Instagram met trop de temps à traiter la vidéo. Réessaie dans quelques minutes.");
}

// Publie une image, un Reel ou une story sur le compte connecté.
export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return Response.json({ error: "Aucun compte Instagram connecté. Connecte ton compte d'abord." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const format = (body?.format ?? "photo") as Format;
  const mediaUrl = typeof body?.mediaUrl === "string" ? body.mediaUrl.trim() : "";
  const legende = typeof body?.caption === "string" ? body.caption.trim() : "";

  if (!/^https:\/\//i.test(mediaUrl)) {
    return Response.json(
      { error: "Donne l'adresse (URL) publique en https du média. Instagram doit pouvoir la télécharger : les fichiers de ton ordinateur ne fonctionnent pas." },
      { status: 400 },
    );
  }
  if (legende.length > LEGENDE_MAX) {
    return Response.json({ error: `La légende dépasse ${LEGENDE_MAX} caractères.` }, { status: 400 });
  }

  const video = format === "reel" || (format === "story" && /\.(mp4|mov)(\?|$)/i.test(mediaUrl));

  const params: Record<string, string> = { access_token: session.token };
  if (video) params.video_url = mediaUrl;
  else params.image_url = mediaUrl;
  if (format === "reel") params.media_type = "REELS";
  if (format === "story") params.media_type = "STORIES";
  // Instagram refuse les légendes sur les stories.
  if (legende && format !== "story") params.caption = legende;

  try {
    const conteneur = await graphPost(`${session.userId}/media`, params);
    if (!conteneur?.id) throw new Error("Instagram n'a pas créé le média.");

    if (video) await attendreConteneur(conteneur.id, session.token);

    const publie = await graphPost(`${session.userId}/media_publish`, {
      creation_id: conteneur.id,
      access_token: session.token,
    });

    let permalink: string | undefined;
    try {
      permalink = (await graphGet(publie.id, { fields: "permalink", access_token: session.token })).permalink;
    } catch {
      // Le lien n'est pas indispensable (les stories n'en ont pas) : on publie quand même.
    }

    return Response.json({ id: publie.id, permalink, format });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
