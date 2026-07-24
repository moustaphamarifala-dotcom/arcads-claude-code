export const runtime = "nodejs";
export const maxDuration = 300;

const REPLICATE_API = "https://api.replicate.com/v1";
// Modèle premium (si une clé Replicate est présente) : FLUX 1.1 Pro, très photoréaliste
const PREMIUM_MODEL = "black-forest-labs/flux-1.1-pro";

// Suffixes de style qui poussent vers l'ultra-réalisme
// On insiste sur la netteté (mise au point nette, ultra détaillé, sans flou)
// pour éviter le rendu doux/flou du modèle gratuit.
const SHARP = "mise au point nette, ultra détaillé, netteté maximale, image nette et piquée, sans flou, haute résolution";
const STYLE_SUFFIX: Record<string, string> = {
  "Réaliste": `photographie ultra réaliste, lumière naturelle, texture réaliste, ${SHARP}, 8k`,
  "Portrait": `portrait photographique ultra réaliste, peau détaillée, regard vivant, bokeh doux, objectif 85mm, lumière de studio, ${SHARP}`,
  "Paysage": `paysage photographique ultra réaliste, grand angle, lumière naturelle dorée, profondeur, ${SHARP}, 8k`,
  "Produit": `photographie de produit ultra réaliste, studio, éclairage professionnel, fond épuré, reflets réalistes, ${SHARP}`,
  "Nourriture": `photographie culinaire ultra réaliste, appétissante, gros plan, lumière naturelle douce, détails de texture, ${SHARP}`,
  "Rue / Vie": `photographie de rue ultra réaliste, ambiance authentique, lumière naturelle, moment sur le vif, ${SHARP}`,
  "Mode / Couture": `photographie de mode ultra réaliste, mannequin, vêtement de couture élégant, tissu détaillé, pose professionnelle, éclairage de studio, style éditorial magazine, ${SHARP}`,
};

// Résolutions plus élevées = images plus nettes
const SIZES: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1280, height: 1280 },
  "3:2": { width: 1440, height: 960 },
  "2:3": { width: 960, height: 1440 },
  "16:9": { width: 1536, height: 864 },
  "9:16": { width: 864, height: 1536 },
};

export async function POST(req: Request) {
  const { prompt, style, aspectRatio } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Décris l'image que tu veux générer." }, { status: 400 });
  }

  const suffix = STYLE_SUFFIX[style] ?? STYLE_SUFFIX["Réaliste"];
  const enriched = `${prompt.trim()}, ${suffix}`;
  const { width, height } = SIZES[aspectRatio] ?? SIZES["1:1"];

  const token = process.env.REPLICATE_API_TOKEN;

  try {
    let imageUrl: string | null = null;

    if (token) {
      // ── Mode premium : FLUX 1.1 Pro via Replicate ──
      const ar =
        aspectRatio && ["1:1", "3:2", "2:3", "16:9", "9:16"].includes(aspectRatio)
          ? aspectRatio
          : "1:1";
      const res = await fetch(`${REPLICATE_API}/models/${PREMIUM_MODEL}/predictions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait=60",
        },
        body: JSON.stringify({
          input: { prompt: enriched, aspect_ratio: ar, output_format: "jpg", output_quality: 95 },
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        return Response.json({ error: `Erreur Replicate (${res.status}) : ${detail}` }, { status: 502 });
      }
      const prediction = await res.json();
      if (prediction.status === "failed") {
        return Response.json({ error: `Génération échouée : ${prediction.error ?? "raison inconnue"}` }, { status: 502 });
      }
      imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    } else {
      // ── Mode gratuit : FLUX via Pollinations.ai (sans clé) ──
      const seed = Math.floor(Math.random() * 1_000_000);
      imageUrl =
        `https://image.pollinations.ai/prompt/${encodeURIComponent(enriched)}` +
        `?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;
    }

    if (!imageUrl) {
      return Response.json({ error: "Aucune image générée. Réessayez." }, { status: 502 });
    }

    // On récupère les octets côté serveur : image en même origine, affichage et
    // téléchargement propres, sans problème de CORS.
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
