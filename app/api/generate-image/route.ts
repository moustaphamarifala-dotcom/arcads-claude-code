export const runtime = "nodejs";
export const maxDuration = 300;

const REPLICATE_API = "https://api.replicate.com/v1";
// FLUX Schnell : rapide et économique, bon rendu général
const IMAGE_MODEL = "black-forest-labs/flux-schnell";

export async function POST(req: Request) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return Response.json(
      { error: "REPLICATE_API_TOKEN manquant. Ajoutez-le dans votre fichier .env" },
      { status: 500 },
    );
  }

  const { prompt, aspectRatio } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Le champ « prompt » est requis." }, { status: 400 });
  }

  const res = await fetch(`${REPLICATE_API}/models/${IMAGE_MODEL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Attend le résultat jusqu'à 60 s avant de renvoyer la prédiction
      Prefer: "wait=60",
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: aspectRatio || "1:1",
        num_outputs: 1,
        output_format: "webp",
        output_quality: 90,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json(
      { error: `Erreur Replicate (${res.status}) : ${detail}` },
      { status: 502 },
    );
  }

  const prediction = await res.json();

  if (prediction.status === "failed") {
    return Response.json(
      { error: `La génération a échoué : ${prediction.error ?? "raison inconnue"}` },
      { status: 502 },
    );
  }

  const output = Array.isArray(prediction.output)
    ? prediction.output[0]
    : prediction.output;

  return Response.json({
    id: prediction.id,
    status: prediction.status,
    imageUrl: output ?? null,
  });
}
