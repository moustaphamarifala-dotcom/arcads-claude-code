# 🎨 Studio de Génération de Contenu IA

Application web de génération de contenu par intelligence artificielle : **textes**, **images** et **vidéos**, dans une interface simple en français.

**✅ Fonctionne gratuitement, sans aucune clé API** — les textes et les images utilisent alors Pollinations.ai. Si vous ajoutez des clés API (optionnel), l'application bascule automatiquement sur des moteurs premium de meilleure qualité.

## Fonctionnalités

| Onglet / Page | Mode gratuit (sans clé) | Mode premium (avec clés) |
|---|---|---|
| 🎬 **Studio UGC** (`/ugc`) | Script + visuels (Pollinations) + voix du navigateur | Claude (script), FLUX (visuels), ElevenLabs (voix), WAN (vidéo) |
| ✍️ **Textes** | Pollinations.ai | Claude (Anthropic), streaming temps réel |
| 🎨 **Images** | Pollinations.ai | FLUX Schnell (Replicate) |
| 🎬 **Vidéos** | ❌ non disponible* | WAN 2.1 (Replicate) |
| 📷 **Studio Photo** (`/photo`) | FLUX ultra-réaliste (Pollinations) | FLUX 1.1 Pro (Replicate) |
| 🔎 **Qui est qui ?** (`personnes.html`) | Fichier autonome — Wikipédia + Wikidata | — (identique) |
| 🔎 **Fiches Personnalités** (`/personnes`) | Wikipédia + Wikidata | — (identique) |
| ⚡ **Intel** (`/intel`) | Google Actualités + Pollinations.ai | Google Actualités + Claude |

Le **Studio UGC** (page `/ugc`) fabrique des **vidéos UGC** — ces vidéos verticales filmées au smartphone, face caméra, où une personne ordinaire parle d'un produit comme elle en parlerait à une amie. Tu décris ton produit (bénéfices, prix, public, angle, plateforme, durée) et l'application produit :

1. le **script complet** — accroche des 3 premières secondes, scènes minutées (texte dit à voix haute, plan à filmer, sous-titre à incruster), appel à l'action, légende et hashtags ;
2. le **portrait du créateur** qui parle à l'écran, puis le **visuel de chaque scène** dans le même style et le même format vertical 9:16 ;
3. la **voix off** — gratuitement avec la voix du navigateur, ou en qualité IA avec une clé ElevenLabs ;
4. la **vidéo animée de l'accroche** (nécessite un jeton Replicate) ;
5. l'**export** du script en texte, et le téléchargement de chaque image.

Le script et les visuels fonctionnent **sans aucune clé API**. Avec une clé Anthropic, le script est écrit par Claude ; avec un jeton Replicate, les visuels passent en FLUX 1.1 Pro et la vidéo devient disponible.

> Le studio écrit des scénarios publicitaires : il ne doit pas servir à inventer de faux témoignages présentés comme réels. Relis toujours les affirmations sur ton produit (prix, délais, résultats) avant de publier.

Le **Studio Photo** (page `/photo`) est un générateur d'images **ultra-réalistes** dédié : styles (portrait, paysage, produit, nourriture…), formats, galerie sauvegardée et téléchargement de chaque image.

**Qui est qui ?** (fichier `public/personnes.html`) est la version **autonome** des fiches personnalités, sur le même principe que *Mon Business* : **un seul fichier HTML**, aucune installation, aucun serveur. Ouvrez-le d'un double-clic et il interroge Wikipédia et Wikidata directement depuis le navigateur (thème clair/sombre, fiches enregistrées en local). Seule une connexion internet est nécessaire.

Les **Fiches Personnalités** (page `/personnes`) permettent de **chercher des informations sur une personnalité publique** : biographie, date et lieu de naissance, âge, nationalité, profession, formation, employeurs, œuvres notables, distinctions, sites et comptes officiels, plus des profils proches à explorer. Les données proviennent de **Wikipédia** (biographie et photo) et de **Wikidata** (faits structurés) — aucune clé API, aucun compte. Les fiches enregistrées restent disponibles dans le navigateur.

> Cet outil ne consulte que des sources publiques et encyclopédiques, et n'a de sens que pour des **personnalités publiques**. Les informations peuvent être incomplètes ou datées : vérifiez toujours à la source avant de publier quoi que ce soit.

**Intel** (page `/intel`) va plus loin que la fiche : il rassemble les **articles de presse récents** sur un sujet (via le flux public de Google Actualités) puis les analyse selon la grille de lecture choisie :

- ⚽ **Mercato** — état du dossier, qui pousse et qui freine, tri entre *confirmé / rapporté / spéculatif*, niveau de solidité de l'info, et ce qui décidera de la suite.
- 🕵️ **Investigation** — ce que disent les sources, qui décide et qui paie, zones d'ombre, questions précises à poser et documents à vérifier.

L'analyse tourne gratuitement sans clé (Pollinations.ai) et bascule sur **Claude** si `ANTHROPIC_API_KEY` est présente. Chaque fiche personnalité propose un bouton « ⚡ Analyser l'actualité » qui ouvre directement Intel sur la bonne personne.

> Intel **résume et questionne des articles existants** : il n'enquête pas, ne révèle rien, n'invente aucun fait et n'écrit au nom d'aucun journaliste. Les titres utilisés sont listés et cliquables sous chaque analyse — vérifiez-les avant de reprendre quoi que ce soit.

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
├── page.tsx                     # Page principale (onglets)
├── ugc/page.tsx                 # Studio UGC (script, storyboard, voix, vidéo)
├── layout.tsx                   # Layout global
├── globals.css                  # Styles
├── components/
│   ├── TextGenerator.tsx        # Interface génération de texte
│   ├── ImageGenerator.tsx       # Interface génération d'image
│   └── VideoGenerator.tsx       # Interface génération de vidéo
└── api/
    ├── ugc-script/route.ts      # Script UGC en JSON (Claude ou moteur gratuit)
    ├── ugc-visual/route.ts      # Visuels verticaux 9:16 (FLUX ou moteur gratuit)
    ├── ugc-voice/route.ts       # Voix off ElevenLabs
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
| **Voix off UGC** (clé ElevenLabs, optionnelle) | Facturé par ElevenLabs selon les caractères lus — la voix du navigateur reste gratuite |
