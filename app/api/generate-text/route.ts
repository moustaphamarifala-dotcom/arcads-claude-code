import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM_PROMPT = `Tu es un rédacteur professionnel expert en création de contenu en français.
Tu produis des contenus de haute qualité : articles de blog, publications pour réseaux sociaux,
textes publicitaires, scripts vidéo, emails marketing, descriptions de produits.
Adapte toujours le ton, la longueur et le format au type de contenu demandé.
Réponds directement avec le contenu, sans préambule du type « Voici votre texte : ».`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY manquante. Ajoutez-la dans votre fichier .env" },
      { status: 500 },
    );
  }

  const { prompt, contentType, tone } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Le champ « prompt » est requis." }, { status: 400 });
  }

  const client = new Anthropic();

  const userMessage = [
    contentType ? `Type de contenu : ${contentType}` : null,
    tone ? `Ton souhaité : ${tone}` : null,
    `Demande : ${prompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
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
