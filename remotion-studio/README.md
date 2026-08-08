# Remotion Studio — moteur de montage vidéo (Bazin Mari Falah)

Moteur de montage vidéo publicitaire écrit en **React + Remotion**, rendu
localement (gratuit, aucune API payante). Il remplace/complète les scripts
Python (`free-studio/`) avec des animations plus fluides (ressort, easing)
et l'audio synchronisé nativement — plus besoin d'étape ffmpeg séparée pour
fusionner voix + vidéo.

## Installation (déjà faite dans cette session)

```bash
cd remotion-studio
npm install
```

## Utiliser le moteur

1. Écris un fichier de spec JSON (voir `examples/test-dore.json`).
2. Lance :
   ```bash
   node render.js examples/ma-pub.json sortie.mp4
   ```

Le script copie automatiquement les photos et l'audio dans `public/`
(nettoyé à chaque usage) puis appelle `remotion render` avec le Chromium
déjà installé sur la machine (`chromium_headless_shell`).

## Format d'une spec JSON

```jsonc
{
  "brand": "BAZIN MARI FALAH",
  "accent": "#f5c542",       // couleur d'accent (titres, CTA)
  "dark": "#0c1130",         // fond CTA (haut du dégradé)
  "dark2": "#1f2650",        // fond CTA (bas du dégradé)
  "audioFile": "/chemin/vers/voix.mp3",
  "phone": "55 13 34 14",    // affiché en bulle verte sur le CTA final
  "tagline": "Commandez sur WhatsApp",
  "ctaDurationInSeconds": 4.5,
  "shots": [
    {
      "photo": "/chemin/vers/photo.jpg",
      "durationInSeconds": 6,
      "from": {"zoom": 1.0, "x": 0.5, "y": 0.3},  // point focal 0..1, zoom départ
      "to":   {"zoom": 1.25, "x": 0.5, "y": 0.55}, // point focal 0..1, zoom arrivée
      "title": "OR LIQUIDE",          // optionnel
      "subtitle": "Sous-titre produit" // optionnel
    }
  ],
  "captions": [
    // optionnel : sous-titres façon dialogue/témoignage, synchronisés en secondes
    {"start": 0.4, "end": 5.0, "speaker": "AWA", "text": "Fatou ! Ton bazin..."}
  ]
}
```

La durée totale est calculée automatiquement (`shots` + `ctaDurationInSeconds`).

## Pourquoi Remotion plutôt que les scripts Python ?

- Animations avec vrai easing/spring (moins mécaniques que les scripts PIL).
- Audio synchronisé **nativement** par Remotion — un seul rendu, pas de mux ffmpeg.
- Composants réutilisables (`KenBurnsShot`, `CaptionBar`, `TitleOverlay`, `CtaCard`)
  qu'on peut étendre facilement (nouveaux styles, nouvelles animations).
- Aperçu interactif possible avec `npx remotion studio` (si besoin de régler
  visuellement les plans avant de rendre).

## Limite connue

Le rendu utilise `chromium_headless_shell` (pas le Chromium "new headless"
standard) car c'est le seul mode qui fonctionne de façon fiable dans cet
environnement sandboxé. Ne pas changer `--browser-executable` dans
`render.js` sans retester.
