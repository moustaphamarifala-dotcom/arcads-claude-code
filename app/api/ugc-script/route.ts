import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

// Claude Opus 5 : meilleure qualité d'écriture pour les scripts publicitaires
const MODEL = "claude-opus-5";

const SYSTEM_PROMPT = `Tu es un scénariste spécialisé dans les vidéos UGC (User Generated Content) :
des vidéos verticales filmées au smartphone, face caméra, par une personne ordinaire qui parle
d'un produit comme elle en parlerait à une amie. Ton style est naturel, direct, sans jargon
publicitaire et sans promesse exagérée.

Règles d'écriture :
- Les 3 premières secondes doivent arrêter le défilement (accroche concrète, jamais « salut tout le monde »).
- Une idée par scène, des phrases courtes, du vocabulaire parlé.
- Le texte « voix » est dit à voix haute : il doit sonner naturel une fois lu.
- Le texte « texte_ecran » est un sous-titre incrusté : 6 mots maximum.
- Le « visuel » décrit un plan filmable (cadrage, décor, action, lumière), en vertical 9:16.
- Aucune allégation médicale, aucun chiffre inventé, aucun faux témoignage nominatif.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans bloc de code.
Schéma exact attendu :
{
  "titre": "titre court de la vidéo",
  "accroche": "la phrase d'accroche des 3 premières secondes",
  "scenes": [
    {
      "temps": "0-3s",
      "role": "Accroche",
      "voix": "ce que la personne dit face caméra",
      "visuel": "description du plan à filmer",
      "texte_ecran": "sous-titre court"
    }
  ],
  "cta": "l'appel à l'action final",
  "description_publication": "légende à publier sous la vidéo",
  "hashtags": ["#exemple"],
  "avatar": { "description": "description physique et décor de la personne qui parle, pour générer son portrait" }
}`;

type Scene = {
  temps: string;
  role: string;
  voix: string;
  visuel: string;
  texte_ecran: string;
};

type Script = {
  titre: string;
  accroche: string;
  scenes: Scene[];
  cta: string;
  description_publication: string;
  hashtags: string[];
  avatar: { description: string };
};

// Le modèle renvoie parfois le JSON entouré de texte ou d'un bloc de code :
// on isole l'objet avant de le lire.
function parseScript(raw: string): Script {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Réponse illisible : aucun script n'a été trouvé.");
  }

  const data = JSON.parse(raw.slice(start, end + 1));

  if (!Array.isArray(data?.scenes) || data.scenes.length === 0) {
    throw new Error("Le script généré ne contient aucune scène.");
  }

  return {
    titre: String(data.titre ?? "Vidéo UGC"),
    accroche: String(data.accroche ?? ""),
    scenes: data.scenes.map((s: Record<string, unknown>) => ({
      temps: String(s?.temps ?? ""),
      role: String(s?.role ?? ""),
      voix: String(s?.voix ?? ""),
      visuel: String(s?.visuel ?? ""),
      texte_ecran: String(s?.texte_ecran ?? ""),
    })),
    cta: String(data.cta ?? ""),
    description_publication: String(data.description_publication ?? ""),
    hashtags: Array.isArray(data.hashtags) ? data.hashtags.map(String) : [],
    avatar: { description: String(data?.avatar?.description ?? "") },
  };
}

// Mode gratuit : Pollinations.ai, sans clé API
async function generateFree(userMessage: string): Promise<string> {
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
    throw new Error(
      "Le service gratuit est momentanément indisponible ou saturé. Réessayez dans quelques instants.",
    );
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function generateClaude(userMessage: string): Promise<string> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  return message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { text: string }).text)
    .join("");
}

export async function POST(req: Request) {
  const { produit, benefices, audience, angle, ton, plateforme, duree } =
    await req.json();

  if (!produit || typeof produit !== "string") {
    return Response.json(
      { error: "Indique au moins le nom du produit ou du service." },
      { status: 400 },
    );
  }

  const secondes = Number(duree) || 30;
  const nbScenes = secondes <= 15 ? "3 à 4" : secondes <= 30 ? "4 à 6" : "6 à 8";

  const userMessage = [
    `Produit ou service : ${produit}`,
    benefices ? `Bénéfices et détails : ${benefices}` : null,
    audience ? `Public visé : ${audience}` : null,
    angle ? `Angle créatif : ${angle}` : null,
    ton ? `Ton : ${ton}` : null,
    `Plateforme : ${plateforme || "TikTok"} (vidéo verticale 9:16)`,
    `Durée cible : ${secondes} secondes, soit ${nbScenes} scènes.`,
    "Écris le script complet en français.",
  ]
    .filter(Boolean)
    .join("\n");

  const moteur = process.env.ANTHROPIC_API_KEY ? "claude" : "gratuit";

  try {
    const raw =
      moteur === "claude"
        ? await generateClaude(userMessage)
        : await generateFree(userMessage);

    return Response.json({ script: parseScript(raw), moteur });
  } catch (err) {
    return Response.json(
      { error: `Génération du script impossible : ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
