export const runtime = "nodejs";
export const maxDuration = 300;

const REPLICATE_API = "https://api.replicate.com/v1";
// WAN 2.1 : génération texte → vidéo, bon rapport qualité/coût
const VIDEO_MODEL = "wan-video/wan-2.1-1.3b";

// POST : lance une génération vidéo (asynchrone — la vidéo prend plusieurs minutes)
export async function POST(req: Request) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return Response.json(
      {
        error:
          "La génération de vidéos nécessite un jeton Replicate (il n'existe pas d'API vidéo gratuite fiable). " +
          "Les textes et les images fonctionnent gratuitement sans clé. " +
          "Pour activer les vidéos, ajoutez REPLICATE_API_TOKEN dans votre fichier .env",
      },
      { status: 402 },
    );
  }

  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Le champ « prompt » est requis." }, { status: 400 });
  }

  const res = await fetch(`${REPLICATE_API}/models/${VIDEO_MODEL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: { prompt } }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json(
      { error: `Erreur Replicate (${res.status}) : ${detail}` },
      { status: 502 },
    );
  }

  const prediction = await res.json();
  return Response.json({ id: prediction.id, status: prediction.status });
}

// GET ?id=... : interroge l'état d'une génération en cours
export async function GET(req: Request) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return Response.json({ error: "REPLICATE_API_TOKEN manquant." }, { status: 500 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Paramètre « id » requis." }, { status: 400 });
  }

  const res = await fetch(`${REPLICATE_API}/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json(
      { error: `Erreur Replicate (${res.status}) : ${detail}` },
      { status: 502 },
    );
  }

  const prediction = await res.json();
  const output = Array.isArray(prediction.output)
    ? prediction.output[0]
    : prediction.output;

  return Response.json({
    id: prediction.id,
    status: prediction.status,
    videoUrl: prediction.status === "succeeded" ? (output ?? null) : null,
    error: prediction.error ?? null,
  });
}
