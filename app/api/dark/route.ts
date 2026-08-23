import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

/* --------------------------------------------------------------------------
 * Personas — chaque entrée est un system prompt complet.
 * L'id est ce que le client envoie ; garder les ids stables (ils sont
 * persistés dans le localStorage des conversations).
 * ----------------------------------------------------------------------- */

const PERSONAS: Record<string, { label: string; system: string }> = {
  standard: {
    label: "Standard",
    system: `Tu es DarkGPT, un assistant conversationnel en français.
Tu réponds de façon claire, structurée et utile. Tu utilises le Markdown
(titres, listes, blocs de code) quand cela rend la réponse plus lisible.
Tu vas droit au but : pas de préambule inutile, pas de reformulation de la
question, pas de conclusion qui répète ce qui vient d'être dit.`,
  },
  cash: {
    label: "Sans détour",
    system: `Tu es DarkGPT en mode « sans détour ». Tu dis les choses franchement,
sans enrobage diplomatique et sans flatterie.
Règles :
- Si l'idée de l'utilisateur est mauvaise, tu le dis en premier, et tu expliques pourquoi.
- Tu nommes les risques, les angles morts et les coûts cachés avant les avantages.
- Tu ne complimentes pas par politesse. Tu ne dis pas « excellente question ».
- Tu restes factuel et respectueux : direct ne veut pas dire agressif ou méprisant.
- Quand tu n'es pas sûr, tu le dis explicitement plutôt que de broder.
Réponses courtes et denses. Markdown autorisé.`,
  },
  dev: {
    label: "Dev",
    system: `Tu es DarkGPT en mode développeur senior.
Tu réponds avec du code fonctionnel, complet et commenté seulement là où c'est utile.
Règles :
- Toujours préciser le langage sur les blocs de code (\`\`\`ts, \`\`\`python…).
- Donner le code d'abord, l'explication après, en quelques puces.
- Signaler les cas limites, les erreurs à gérer et les implications de performance.
- Pas de pseudo-code quand du vrai code est possible.`,
  },
  copy: {
    label: "Copywriter",
    system: `Tu es DarkGPT en mode copywriter publicitaire (spécialiste acquisition payante).
Tu écris des accroches, scripts et textes d'annonces qui convertissent.
Règles :
- Toujours proposer plusieurs variantes (3 minimum) avec des angles différents.
- Nommer l'angle utilisé pour chaque variante (douleur, preuve sociale, curiosité, gain, autorité…).
- Français naturel, phrases courtes, zéro jargon marketing creux.
- Pas de promesse trompeuse ni de fausse statistique : si un chiffre est nécessaire, laisse un
  emplacement à compléter par l'utilisateur.`,
  },
  prof: {
    label: "Pédagogue",
    system: `Tu es DarkGPT en mode pédagogue.
Tu expliques les notions en partant de ce que l'utilisateur sait déjà.
Règles :
- Commencer par l'intuition, puis la définition précise, puis un exemple concret.
- Une analogie maximum par réponse, et seulement si elle éclaire vraiment.
- Terminer par une question de vérification quand le sujet est complexe.
- Pas de mur de texte : structure en sections courtes.`,
  },
};

const DEFAULT_PERSONA = "standard";
const MAX_HISTORY = 40;

/* --------------------------------------------------------------------------
 * Protocole de flux : NDJSON — une ligne = un événement JSON.
 *   {"type":"thinking","text":"…"}  raisonnement résumé (mode Claude)
 *   {"type":"text","text":"…"}      fragment de réponse
 *   {"type":"error","message":"…"}  erreur survenue en cours de flux
 * JSON.stringify échappe les retours à la ligne : découper sur "\n" est sûr.
 * ----------------------------------------------------------------------- */

type Event =
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "error"; message: string };

const encoder = new TextEncoder();
const line = (e: Event) => encoder.encode(JSON.stringify(e) + "\n");

/* Mode gratuit : Pollinations.ai, sans clé API (qualité moindre, débit limité) */
async function answerFree(
  system: string,
  messages: Anthropic.MessageParam[],
): Promise<Response> {
  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!res.ok) {
    return new Response(
      line({
        type: "error",
        message:
          "Le service gratuit est momentanément indisponible ou saturé. Réessayez dans quelques instants, ou ajoutez ANTHROPIC_API_KEY dans .env pour passer sur Claude.",
      }),
      { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } },
    );
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";

  return new Response(line({ type: "text", text }), {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { messages: raw, persona } = (body ?? {}) as {
    messages?: unknown;
    persona?: unknown;
  };

  if (!Array.isArray(raw) || raw.length === 0) {
    return Response.json(
      { error: "Le champ « messages » est requis et doit être un tableau non vide." },
      { status: 400 },
    );
  }

  // On ne garde que les tours bien formés, et seulement les N derniers.
  const messages: Anthropic.MessageParam[] = raw
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        !!m &&
        typeof m === "object" &&
        ((m as any).role === "user" || (m as any).role === "assistant") &&
        typeof (m as any).content === "string" &&
        (m as any).content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content }));

  // L'API exige que le premier message soit un tour utilisateur.
  while (messages.length && messages[0].role !== "user") messages.shift();

  if (messages.length === 0) {
    return Response.json(
      { error: "Aucun message exploitable dans l'historique." },
      { status: 400 },
    );
  }

  const key = typeof persona === "string" && persona in PERSONAS ? persona : DEFAULT_PERSONA;
  const system = PERSONAS[key].system;

  // Sans clé Anthropic → bascule automatique sur le mode gratuit.
  if (!process.env.ANTHROPIC_API_KEY) {
    return answerFree(system, messages);
  }

  const client = new Anthropic();

  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 64000,
    thinking: { type: "adaptive", display: "summarized" },
    system: [
      {
        type: "text",
        text: system,
        // Le system prompt est stable d'un tour à l'autre → cache le préfixe.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type !== "content_block_delta") continue;
          if (event.delta.type === "text_delta") {
            controller.enqueue(line({ type: "text", text: event.delta.text }));
          } else if (event.delta.type === "thinking_delta") {
            controller.enqueue(line({ type: "thinking", text: event.delta.thinking }));
          }
        }
        controller.close();
      } catch (err) {
        const message =
          err instanceof Anthropic.RateLimitError
            ? "Limite de débit atteinte côté Anthropic. Réessayez dans un instant."
            : err instanceof Anthropic.AuthenticationError
              ? "Clé ANTHROPIC_API_KEY invalide ou expirée."
              : err instanceof Anthropic.APIError
                ? `Erreur API (${err.status}) : ${err.message}`
                : "Erreur inattendue pendant la génération.";
        controller.enqueue(line({ type: "error", message }));
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
