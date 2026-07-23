export const runtime = "nodejs";
export const maxDuration = 300;

// « Nano Banana » = modèle image de Google Gemini.
// Modifiable via GEMINI_IMAGE_MODEL (ex. gemini-3-pro-image-preview pour Nano Banana Pro).
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

type Part = { text?: string; inline_data?: { mime_type: string; data: string } };

export async function POST(req: Request) {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      {
        error:
          "Clé Google manquante. Ajoute GOOGLE_API_KEY dans les variables d'environnement (Vercel → Settings → Environment Variables), puis redéploie.",
      },
      { status: 400 },
    );
  }

  const { prompt, images } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Écris une instruction (ce que tu veux créer)." }, { status: 400 });
  }
  if (!Array.isArray(images) || images.length === 0) {
    return Response.json({ error: "Ajoute au moins une photo de référence (ton tissu bazin, un modèle…)." }, { status: 400 });
  }

  // Construit les « parts » : l'instruction + chaque image de référence
  const parts: Part[] = [{ text: prompt }];
  for (const img of images) {
    const m = /^data:(.+?);base64,(.*)$/.exec(img);
    if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const detail = await r.text();
      // Message clair pour les erreurs fréquentes
      let msg = `Erreur Google (${r.status})`;
      if (r.status === 400 && /API key not valid/i.test(detail)) msg = "Clé API Google invalide. Vérifie GOOGLE_API_KEY.";
      else if (r.status === 429) msg = "Quota gratuit Google atteint pour le moment. Réessaie plus tard, ou active la facturation dans Google AI Studio.";
      else if (r.status === 404) msg = `Modèle « ${MODEL} » introuvable pour ta clé. Essaie un autre modèle via GEMINI_IMAGE_MODEL.`;
      else msg = `Erreur Google (${r.status}) : ${detail.slice(0, 300)}`;
      return Response.json({ error: msg }, { status: 502 });
    }

    const data = await r.json();
    const respParts = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = respParts.find((p: Record<string, unknown>) => p.inlineData || p.inline_data);
    const inline = (imgPart?.inlineData || imgPart?.inline_data) as
      | { data?: string; mimeType?: string; mime_type?: string }
      | undefined;

    if (!inline?.data) {
      const txt = respParts.map((p: Record<string, unknown>) => p.text).filter(Boolean).join(" ");
      return Response.json(
        { error: txt || "Le modèle n'a pas renvoyé d'image (demande peut-être refusée). Reformule ton instruction." },
        { status: 502 },
      );
    }

    const buf = Buffer.from(inline.data, "base64");
    return new Response(buf, {
      headers: { "Content-Type": inline.mimeType || inline.mime_type || "image/png", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return Response.json({ error: `Une erreur est survenue : ${(err as Error).message}` }, { status: 500 });
  }
}
