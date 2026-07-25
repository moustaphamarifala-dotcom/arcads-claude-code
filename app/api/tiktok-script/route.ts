import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM_PROMPT = `Tu es scénariste TikTok spécialisé dans le commerce en Afrique de l'Ouest
(couture, bazin, mode, artisanat, vente en direct via WhatsApp).

Tu écris en français simple, parlé, direct. Jamais de langue de bois, jamais de vocabulaire
marketing creux (« booster », « révolutionner », « incontournable »).

Règles de fabrication non négociables :
- L'accroche fait 8 à 12 mots maximum et se dit en moins de 3 secondes.
- Aucune politesse d'introduction. On entre dans le sujet au premier mot.
- Une relance de tension toutes les 5 secondes environ (« mais », « sauf que », « et là »).
- Un seul appel à l'action, à la fin, très concret.
- Le prix et les chiffres sont toujours en francs CFA.
- Tu n'inventes jamais de promesse de résultat ni de témoignage client.

Tu produis TOUJOURS cette structure exacte, en markdown :

## 3 accroches au choix
1. …
2. …
3. …
(pour chacune, une ligne « → pourquoi ça marche : … »)

## Script scène par scène
| Temps | Ce qu'on voit | Ce qu'on dit | Texte à l'écran |
(4 à 7 lignes, timecodes réels qui tiennent dans la durée demandée)

## Appel à l'action
La phrase exacte à prononcer, mot pour mot.

## Légende
2 lignes maximum, contenant les mots que les gens tapent dans la recherche TikTok.

## Hashtags
6 hashtags : 1 large, 2 moyens, 3 de niche.

## Son et tournage
Type de son à chercher, et 2 conseils de tournage réalisables avec un téléphone.`;

// Mode gratuit : Pollinations.ai, sans clé API (qualité moindre, limites de débit)
async function genererGratuit(message: string): Promise<Response> {
  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    }),
  });

  if (!res.ok) {
    return Response.json(
      {
        error:
          "Le service gratuit est momentanément indisponible ou saturé. Réessayez dans quelques instants.",
      },
      { status: 502 },
    );
  }

  const data = await res.json();
  const texte: string = data?.choices?.[0]?.message?.content ?? "";

  return new Response(texte, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const { produit, prix, ville, angle, duree, objectif, details } = await req.json();

  if (!produit || typeof produit !== "string") {
    return Response.json({ error: "Le champ « produit » est requis." }, { status: 400 });
  }

  const message = [
    `Produit : ${produit}`,
    prix ? `Prix : ${prix} F CFA` : null,
    ville ? `Ville / zone de vente : ${ville}` : null,
    angle ? `Angle de la vidéo : ${angle}` : null,
    `Durée cible : ${duree || 25} secondes`,
    objectif ? `Objectif de la vidéo : ${objectif}` : null,
    details ? `À savoir sur mon activité : ${details}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // Sans clé Anthropic → bascule automatique sur le mode gratuit
  if (!process.env.ANTHROPIC_API_KEY) {
    return genererGratuit(message);
  }

  const client = new Anthropic();

  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: message }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
