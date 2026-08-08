export const runtime = "nodejs";
export const maxDuration = 300;

const ELEVEN_API = "https://api.elevenlabs.io/v1/text-to-speech";

// Voix ElevenLabs publiques, multilingues (donc francophones)
const VOICES: Record<string, string> = {
  femme: "21m00Tcm4TlvDq8ikWAM",
  homme: "pNInz6obpgDQGcFmaJgB",
};

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;

  // Sans clé, la page bascule sur la synthèse vocale du navigateur (gratuite).
  if (!key) {
    return Response.json(
      {
        error:
          "La voix off IA nécessite une clé ElevenLabs (ELEVENLABS_API_KEY). " +
          "Sans clé, utilise le bouton « Écouter » : la voix du navigateur lit le script gratuitement.",
      },
      { status: 402 },
    );
  }

  const { texte, voix } = await req.json();

  if (!texte || typeof texte !== "string") {
    return Response.json({ error: "Aucun texte à lire." }, { status: 400 });
  }

  const voiceId =
    process.env.ELEVENLABS_VOICE_ID || VOICES[voix] || VOICES.femme;

  try {
    const res = await fetch(`${ELEVEN_API}/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: texte,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.35 },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: `Erreur ElevenLabs (${res.status}) : ${detail}` },
        { status: 502 },
      );
    }

    const buf = await res.arrayBuffer();
    return new Response(buf, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return Response.json(
      { error: `Une erreur est survenue : ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
