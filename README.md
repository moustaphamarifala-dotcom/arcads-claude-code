# arcads-claude-code

Génération de vidéos publicitaires IA (style Arcads) propulsée par l'**API Higgsfield**.

Le pipeline couvre les trois étapes d'une pub UGC :

1. **Acteur** — génération d'une image photoréaliste avec le modèle **Soul** (text→image)
2. **Mouvement** — animation d'une image en clip cinématique avec **DoP** (image→vidéo)
3. **Voix** — avatar parlant à partir d'une image + audio avec **Speak** (le cœur du cas d'usage Arcads)

## Installation

```bash
npm install
cp .env.example .env   # puis renseigner HF_CREDENTIALS
```

Les clés API se créent sur [platform.higgsfield.ai](https://platform.higgsfield.ai), format `KEY_ID:KEY_SECRET`.

## Utilisation

```bash
# 1. Générer un acteur (format vertical 9:16 par défaut)
node src/cli.js image "jeune femme souriante tenant une bouteille de sérum, lumière naturelle"

# 2. Animer une image en clip
node src/cli.js video https://exemple.com/acteur.jpg "lent zoom avant, caméra cinématique"

# 3. Générer la pub complète : avatar qui lit le script (audio WAV)
node src/cli.js ad https://exemple.com/acteur.jpg https://exemple.com/script.wav "présentation enthousiaste face caméra"
```

Ou en tant que bibliothèque :

```js
import { generateActorImage, generateSpeakingAd } from './src/index.js';

const { urls: [actorUrl] } = await generateActorImage('homme 30 ans, t-shirt uni, fond studio');
const { urls: [videoUrl] } = await generateSpeakingAd(actorUrl, 'https://exemple.com/voix.wav');
console.log(videoUrl);
```

## Webhooks (optionnel)

Par défaut le client attend le résultat par polling (toutes les 2 s). Pour un traitement
asynchrone, définir `HF_WEBHOOK_URL` (et `HF_WEBHOOK_SECRET`) dans `.env` : les jobs sont
alors soumis sans blocage et Higgsfield notifie votre endpoint à la fin de la génération.

## Statuts de génération

`queued` → `in_progress` → `completed` (ou `failed` / `nsfw`, crédits remboursés).
