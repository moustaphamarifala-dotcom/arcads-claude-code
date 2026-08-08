export const runtime = "nodejs";
export const maxDuration = 300;

const REPLICATE_API = "https://api.replicate.com/v1";
const PREMIUM_MODEL = "black-forest-labs/flux-1.1-pro";

// Le rendu UGC n'est PAS une photo de studio : on vise volontairement
// le look « filmé au téléphone », sinon l'image ne passe pas pour de l'authentique.
const UGC_LOOK =
  "photo prise au smartphone, lumière naturelle d'intérieur, rendu authentique et amateur, " +
  "léger grain, personne ordinaire, pas de retouche, pas de studio, cadrage vertical";

const SUFFIX: Record<string, string> = {
  avatar: `selfie face caméra frontale de smartphone, la personne regarde l'objectif, buste cadré, ${UGC_LOOK}`,
  scene: `plan de vidéo UGC verticale, ${UGC_LOOK}`,
  produit: `gros plan du produit tenu à la main, ${UGC_LOOK}`,
};

// Format vertical : c'est celui de TikTok, Reels et Shorts
const WIDTH = 864;
const HEIGHT = 1536;

export async function POST(req: Request) {
  const { prompt, kind } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json(
      { error: "Décris le visuel à générer." },
      { status: 400 },
    );
  }

  const suffix = SUFFIX[kind] ?? SUFFIX.scene;
  const enriched = `${prompt.trim()}, ${suffix}`;
  const token = process.env.REPLICATE_API_TOKEN;

  try {
    let imageUrl: string | null = null;

    if (token) {
      // ── Mode premium : FLUX 1.1 Pro via Replicate ──
      const res = await fetch(`${REPLICATE_API}/models/${PREMIUM_MODEL}/predictions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait=60",
        },
        body: JSON.stringify({
          input: {
            prompt: enriched,
            aspect_ratio: "9:16",
            output_format: "jpg",
            output_quality: 95,
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
          { error: `Génération échouée : ${prediction.error ?? "raison inconnue"}` },
          { status: 502 },
        );
      }
      imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    } else {
      // ── Mode gratuit : FLUX via Pollinations.ai (sans clé) ──
      const seed = Math.floor(Math.random() * 1_000_000);
      imageUrl =
        `https://image.pollinations.ai/prompt/${encodeURIComponent(enriched)}` +
        `?width=${WIDTH}&height=${HEIGHT}&seed=${seed}&model=flux&nologo=true`;
    }

    if (!imageUrl) {
      return Response.json({ error: "Aucune image générée. Réessaie." }, { status: 502 });
    }

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return Response.json(
        { error: "Le service d'images est momentanément saturé. Réessaie dans quelques instants." },
        { status: 502 },
      );
    }

    const buf = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";

    return new Response(buf, {
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch (err) {
    return Response.json(
      { error: `Une erreur est survenue : ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
