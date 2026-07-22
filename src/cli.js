#!/usr/bin/env node
/**
 * CLI de génération de publicités IA via Higgsfield.
 *
 * Usage :
 *   node src/cli.js image "jeune femme souriante tenant une bouteille de sérum, lumière naturelle"
 *   node src/cli.js video <url-image> "lent zoom avant, mouvement de caméra cinématique"
 *   node src/cli.js ad <url-image-acteur> <url-audio-wav> ["style de présentation"]
 */
import { generateActorImage, animateImage, generateSpeakingAd } from './higgsfield.js';

const [command, ...args] = process.argv.slice(2);

function usage() {
  console.log(`Commandes :
  image <prompt>                        Génère une image d'acteur (Soul)
  video <url-image> <prompt>            Anime une image en clip (DoP)
  ad <url-image> <url-audio> [style]    Génère une vidéo d'avatar parlant (Speak)`);
  process.exit(1);
}

function report(result, label) {
  if (result.pending) {
    console.log(`${label} : job ${result.requestId} soumis, résultat livré via webhook.`);
  } else {
    console.log(`${label} :`);
    for (const url of result.urls) console.log(`  ${url}`);
  }
}

try {
  switch (command) {
    case 'image': {
      const [prompt] = args;
      if (!prompt) usage();
      report(await generateActorImage(prompt), 'Image générée');
      break;
    }
    case 'video': {
      const [imageUrl, prompt] = args;
      if (!imageUrl || !prompt) usage();
      report(await animateImage(imageUrl, prompt), 'Vidéo générée');
      break;
    }
    case 'ad': {
      const [imageUrl, audioUrl, style] = args;
      if (!imageUrl || !audioUrl) usage();
      report(await generateSpeakingAd(imageUrl, audioUrl, style ? { prompt: style } : {}), 'Publicité générée');
      break;
    }
    default:
      usage();
  }
} catch (err) {
  console.error(`Erreur : ${err.message}`);
  process.exit(1);
}
