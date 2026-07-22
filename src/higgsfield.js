/**
 * Client Higgsfield — wrapper autour du SDK officiel @higgsfield/client (API v2).
 *
 * Trois briques exposées :
 *  - generateActorImage : crée un « acteur » photoréaliste (modèle Soul, text→image)
 *  - animateImage       : anime une image en vidéo (modèle DoP, image→vidéo)
 *  - generateSpeakingAd : fait parler un acteur à partir d'une image + audio (Speak)
 *
 * Auth : HF_CREDENTIALS="KEY_ID:KEY_SECRET" (voir .env.example).
 */
import 'dotenv/config';
import { higgsfield, config } from '@higgsfield/client/v2';

if (process.env.HF_CREDENTIALS) {
  config({ credentials: process.env.HF_CREDENTIALS });
}

const webhook =
  process.env.HF_WEBHOOK_URL && process.env.HF_WEBHOOK_SECRET
    ? { url: process.env.HF_WEBHOOK_URL, secret: process.env.HF_WEBHOOK_SECRET }
    : undefined;

async function subscribe(endpoint, input) {
  const response = await higgsfield.subscribe(endpoint, {
    input,
    withPolling: !webhook,
    webhook,
  });

  if (webhook) return { pending: true, requestId: response.request_id, response };

  if (response.status !== 'completed') {
    throw new Error(`Génération Higgsfield non aboutie (statut : ${response.status})`);
  }

  const urls = [
    ...(response.images ?? []).map((i) => i.url),
    ...(response.video ? [response.video.url] : []),
  ];
  return { pending: false, urls, response };
}

/**
 * Génère une image d'acteur/produit photoréaliste avec le modèle Soul.
 * @param {string} prompt  Description de la scène ou de l'acteur.
 * @param {object} [options]
 * @param {string} [options.size='1152x2048']  Format (portrait 9:16 par défaut, voir SoulSize).
 * @param {'720p'|'1080p'} [options.quality='1080p']
 * @param {number} [options.seed]  Seed pour un rendu reproductible.
 */
export async function generateActorImage(prompt, { size = '1152x2048', quality = '1080p', seed } = {}) {
  return subscribe('/v1/text2image/soul', {
    prompt,
    width_and_height: size,
    quality,
    batch_size: 1,
    enhance_prompt: true,
    ...(seed !== undefined && { seed }),
  });
}

/**
 * Anime une image statique en clip vidéo avec le modèle DoP.
 * @param {string} imageUrl  URL publique de l'image source.
 * @param {string} prompt    Direction de mouvement/caméra (ex. « lent zoom avant »).
 * @param {object} [options]
 * @param {'dop-lite'|'dop-turbo'|'dop-standard'} [options.model='dop-turbo']
 * @param {number} [options.seed]
 */
export async function animateImage(imageUrl, prompt, { model = 'dop-turbo', seed } = {}) {
  return subscribe('/v1/image2video/dop', {
    model,
    prompt,
    input_images: [{ type: 'image_url', image_url: imageUrl }],
    ...(seed !== undefined && { seed }),
  });
}

/**
 * Génère une vidéo d'avatar parlant (cas d'usage Arcads) avec Speak.
 * @param {string} imageUrl  Image de l'acteur (visage visible).
 * @param {string} audioUrl  Audio WAV du script publicitaire.
 * @param {object} [options]
 * @param {string} [options.prompt='Présentation professionnelle face caméra']
 * @param {'mid'|'high'} [options.quality='mid']
 * @param {5|10|15} [options.duration=15]  Durée max de la vidéo en secondes.
 */
export async function generateSpeakingAd(
  imageUrl,
  audioUrl,
  { prompt = 'Présentation professionnelle face caméra', quality = 'mid', duration = 15 } = {},
) {
  return subscribe('/v1/speak/higgsfield', {
    input_image: { type: 'image_url', image_url: imageUrl },
    input_audio: { type: 'audio_url', audio_url: audioUrl },
    prompt,
    quality,
    duration,
  });
}
