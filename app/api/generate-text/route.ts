import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM_PROMPT = `Tu es un rédacteur professionnel expert en création de contenu en français.
Tu produis des contenus de haute qualité : articles de blog, publications pour réseaux sociaux,
textes publicitaires, scripts vidéo, emails marketing, descriptions de produits.
Adapte toujours le ton, la longueur et le format au type de contenu demandé.
Réponds directement avec le contenu, sans préambule du type « Voici votre texte : ».`;

// Gemini passe par l'Interactions API (une interaction = un tour complet), et non par
// l'ancien endpoint generateContent utilisé ailleurs dans l'app pour les images.
const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.7-flash";
// minimal | low | medium | high — ou « off » pour ne rien envoyer et laisser le modèle décider.
// Les tokens de réflexion sont facturés sans apparaître dans la sortie visible : « low » suffit
// largement pour de la rédaction et évite de payer un raisonnement inutile.
const GEMINI_THINKING_LEVEL = process.env.GEMINI_THINKING_LEVEL || "low";

type Moteur = "claude" | "gemini" | "gratuit";

// Mode gratuit : Pollinations.ai, sans clé API (qualité moindre, limites de débit)
async function generateFree(userMessage: string): Promise<Response> {
  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
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
  const text: string = data?.choices?.[0]?.message?.content ?? "";

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Moteur": "gratuit" },
  });
}

type EvenementSSE = {
  event_type?: string;
  delta?: { type?: string; text?: string };
};

// Une ligne SSE « data: {...} » → le fragment de texte qu'elle transporte, s'il y en a un.
// Les autres événements (step.start, thought_summary, interaction.completed…) sont ignorés.
function fragmentTexte(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;

  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") return null;

  try {
    const event = JSON.parse(payload) as EvenementSSE;
    if (event.event_type !== "step.delta" || event.delta?.type !== "text") return null;
    return event.delta.text ?? null;
  } catch {
    return null;
  }
}

// Transforme le flux SSE de l'Interactions API en flux de texte brut, le format que
// le front-end consomme déjà pour Claude.
function fluxTexteGemini(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // La dernière ligne peut être incomplète : on la garde pour le prochain chunk.
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const text = fragmentTexte(line);
            if (text) controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel(reason) {
      reader.cancel(reason);
    },
  });
}

async function generateGemini(userMessage: string, key: string): Promise<Response> {
  const generationConfig: Record<string, unknown> = { max_output_tokens: 8192 };
  if (GEMINI_THINKING_LEVEL !== "off") {
    generationConfig.thinking_level = GEMINI_THINKING_LEVEL;
  }

  const res = await fetch(GEMINI_INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      model: GEMINI_TEXT_MODEL,
      stream: true,
      system_instruction: SYSTEM_PROMPT,
      input: userMessage,
      generation_config: generationConfig,
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    let msg = `Erreur Google (${res.status})`;
    if (res.status === 400 && /API key not valid/i.test(detail)) {
      msg = "Clé API Google invalide. Vérifiez GOOGLE_API_KEY.";
    } else if (res.status === 429) {
      msg =
        "Quota Google atteint pour le moment. Réessayez plus tard, ou activez la facturation dans Google AI Studio.";
    } else if (res.status === 404) {
      msg = `Modèle « ${GEMINI_TEXT_MODEL} » introuvable pour votre clé. Choisissez-en un autre via GEMINI_TEXT_MODEL.`;
    } else if (detail) {
      msg = `Erreur Google (${res.status}) : ${detail.slice(0, 300)}`;
    }
    return Response.json({ error: msg }, { status: 502 });
  }

  return new Response(fluxTexteGemini(res.body), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Moteur": "gemini",
    },
  });
}

export async function POST(req: Request) {
  const { prompt, contentType, tone, moteur } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Le champ « prompt » est requis." }, { status: 400 });
  }

  const userMessage = [
    contentType ? `Type de contenu : ${contentType}` : null,
    tone ? `Ton souhaité : ${tone}` : null,
    `Demande : ${prompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  // Ordre par défaut : Claude → Gemini → mode gratuit. Le champ « moteur » de la requête
  // permet de forcer un moteur précis (utile pour tester quand plusieurs clés existent).
  const demande: Moteur | null =
    moteur === "claude" || moteur === "gemini" || moteur === "gratuit" ? moteur : null;
  const choisi: Moteur =
    demande ?? (anthropicKey ? "claude" : googleKey ? "gemini" : "gratuit");

  if (choisi === "gemini") {
    if (!googleKey) {
      return Response.json(
        {
          error:
            "Clé Google manquante. Ajoutez GOOGLE_API_KEY dans vos variables d'environnement (clé gratuite avec quota sur https://aistudio.google.com/apikey).",
        },
        { status: 400 },
      );
    }
    return generateGemini(userMessage, googleKey);
  }

  // Sans clé Anthropic → bascule automatique sur le mode gratuit
  if (choisi === "gratuit" || !anthropicKey) {
    return generateFree(userMessage);
  }

  const client = new Anthropic();

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
      "X-Moteur": "claude",
    },
  });
}
