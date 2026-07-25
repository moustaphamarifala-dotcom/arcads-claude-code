# 🎨 Studio de Génération de Contenu IA

Application web de génération de contenu par intelligence artificielle : **textes**, **images** et **vidéos**, dans une interface simple en français.

**✅ Fonctionne gratuitement, sans aucune clé API** — les textes et les images utilisent alors Pollinations.ai. Si vous ajoutez des clés API (optionnel), l'application bascule automatiquement sur des moteurs premium de meilleure qualité.

## Fonctionnalités

| Onglet / Page | Mode gratuit (sans clé) | Mode premium (avec clés) |
|---|---|---|
| ✍️ **Textes** | Pollinations.ai | Claude (Anthropic), streaming temps réel |
| 🎨 **Images** | Pollinations.ai | FLUX Schnell (Replicate) |
| 🎬 **Vidéos** | ❌ non disponible* | WAN 2.1 (Replicate) |
| 📷 **Studio Photo** (`/photo`) | FLUX ultra-réaliste (Pollinations) | FLUX 1.1 Pro (Replicate) |
| 📱 **Studio TikTok** (`/tiktok`) | ✅ tout fonctionne sans clé | Scripts écrits par Claude |

Le **Studio Photo** (page `/photo`) est un générateur d'images **ultra-réalistes** dédié : styles (portrait, paysage, produit, nourriture…), formats, galerie sauvegardée et téléchargement de chaque image.

Le **Studio TikTok** (page `/tiktok`) sert à **transformer des vues en commandes**. Six outils, tous en français et en francs CFA :

| Outil | Ce qu'il fait |
|---|---|
| 📅 **Plan 30 jours** | Génère le calendrier complet : quelle vidéo, quel jour, à quelle heure, avec quelle accroche. Fait tourner 4 piliers (attirer / convaincre / prouver / vendre) pour ne pas saturer l'audience. |
| ✍️ **Scripts** | Écrit 3 accroches au choix, le script plan par plan avec timecodes, le texte à l'écran, l'appel à l'action, la légende et les hashtags. |
| 🎣 **Accroches** | 60 structures d'accroches éprouvées, déjà remplies avec ton produit et ton prix, classées par intention. |
| 📊 **Analyser** | Note une vidéo sur 100 **avant** publication, sur 6 critères pondérés (accroche, rétention, émotion, conversion, découvrabilité, format). Chaque point perdu vient avec la correction exacte à faire. |
| #️⃣ **Hashtags** | Compose le mélange 1 large / 2 moyens / 3 niche — la seule stratégie qui permet de réellement se classer. |
| 💰 **Revenus** | Simulateur d'entonnoir vérifiable ligne par ligne, avec 3 scénarios et une analyse de sensibilité qui dit sur quel levier appuyer en premier. |

Le plan, l'analyse, les hashtags et les revenus sont calculés **sur l'appareil**, sans réseau ni clé API. Seuls les scripts appellent une IA.

> ⚠️ Le Fonds Créateur de TikTok (rémunération aux vues) n'existe pas au Sénégal, au Mali, en Côte d'Ivoire ni dans la plupart des pays d'Afrique de l'Ouest. Le simulateur ne compte donc **aucun revenu par vue** : l'argent vient des ventes, des partenariats et de l'affiliation.

Le **Studio Couture Bazin** (page `/couture`) permet d'**habiller un modèle avec ta propre photo de tissu** : ajoute une photo de référence (bazin, modèle…), décris le vêtement, et l'IA crée la tenue. Propulsé par **Nano Banana (Google Gemini)** — nécessite une clé `GOOGLE_API_KEY` (gratuite avec quota sur [Google AI Studio](https://aistudio.google.com/apikey)).

\* Il n'existe à ce jour aucune API de génération vidéo réellement gratuite et fiable.

## Prérequis

- Node.js 18.18 ou plus récent
- C'est tout ! Les clés API sont **optionnelles** (voir `.env.example`)

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en développement — aucune configuration nécessaire
npm run dev

# (Optionnel) Pour le mode premium :
cp .env.example .env
# puis décommentez et remplissez les clés souhaitées
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
app/
├── tiktok/                      # Studio TikTok
│   ├── page.tsx                 # Onglets + profil produit partagé
│   ├── lib/
│   │   ├── viralite.ts          # Moteur d'analyse de viralité (local)
│   │   ├── hooks.ts             # Accroches, piliers, créneaux
│   │   ├── hashtags.ts          # Stratégie de mélange par taille
│   │   ├── revenus.ts           # Entonnoir + analyse de sensibilité
│   │   └── plan.ts              # Générateur de plan 30 jours
│   └── components/              # Un composant par outil
├── page.tsx                     # Page principale (onglets)
├── layout.tsx                   # Layout global
├── globals.css                  # Styles
├── components/
│   ├── TextGenerator.tsx        # Interface génération de texte
│   ├── ImageGenerator.tsx       # Interface génération d'image
│   └── VideoGenerator.tsx       # Interface génération de vidéo
└── api/
    ├── generate-text/route.ts   # API Claude en streaming
    ├── generate-image/route.ts  # API Replicate (FLUX)
    └── generate-video/route.ts  # API Replicate (WAN) + suivi d'état
```

## Déploiement

L'application se déploie en un clic sur [Vercel](https://vercel.com) :

1. Importez ce dépôt dans Vercel
2. Ajoutez les variables d'environnement `ANTHROPIC_API_KEY` et `REPLICATE_API_TOKEN`
3. Déployez

## Coûts

| Mode | Coût |
|---|---|
| **Gratuit** (par défaut, sans clé) | 0 F CFA — textes et images illimités, avec des limites de débit et une qualité correcte |
| **Premium textes** (clé Anthropic) | Facturé par Anthropic selon les tokens utilisés |
| **Premium images** (jeton Replicate) | ~0,003 $ par image (FLUX Schnell) |
| **Vidéos** (jeton Replicate requis) | Quelques centimes par vidéo (WAN 2.1) |
