export const runtime = "nodejs";
export const maxDuration = 300;

const REPLICATE_API = "https://api.replicate.com/v1";
// FLUX Schnell : rapide et économique, bon rendu général
const IMAGE_MODEL = "black-forest-labs/flux-schnell";

// Dimensions par format pour le mode gratuit
const FREE_SIZES: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "4:3": { width: 1024, height: 768 },
  "3:2": { width: 1152, height: 768 },
};

// Mode gratuit : Pollinations.ai génère l'image directement depuis une URL, sans clé
function generateFree(prompt: string, aspectRatio: string): Response {
  const { width, height } = FREE_SIZES[aspectRatio] ?? FREE_SIZES["1:1"];
  const seed = Math.floor(Math.random() * 1_000_000);
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  return Response.json({ id: `free-${seed}`, status: "succeeded", imageUrl: url });
}

export async function POST(req: Request) {
  const { prompt, aspectRatio } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Le champ « prompt » est requis." }, { status: 400 });
  }

  // Sans jeton Replicate → bascule automatique sur le mode gratuit
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return generateFree(prompt, aspectRatio || "1:1");
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
