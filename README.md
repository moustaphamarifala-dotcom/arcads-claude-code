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
| 🔎 **Qui est qui ?** (`personnes.html`) | Fichier autonome — Wikipédia + Wikidata | — (identique) |
| 🔎 **Fiches Personnalités** (`/personnes`) | Wikipédia + Wikidata | — (identique) |
| ⚡ **Intel** (`/intel`) | Google Actualités + Pollinations.ai | Google Actualités + Claude |

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

---

## 🤖 Pack de skills Arcads (agent Claude Code / Cursor)

Ce dépôt embarque également le **pack de skills Arcads** de
[krusemediallc/arcads-claude-code](https://github.com/krusemediallc/arcads-claude-code)
(licence MIT — voir `LICENSE-arcads-skill-pack`). Il n'a **aucun lien avec l'application
Next.js ci-dessus** : c'est un ensemble d'instructions pour l'agent (Claude Code ou Cursor)
qui sait piloter l'API Arcads — vidéos IA (Seedance 2.0, Sora 2, Veo 3.1, Kling 3.0,
Grok Video, OmniHuman), images (Nano Banana, ChatGPT Image 2), publicités image pour Meta,
miniatures YouTube.

### Démarrer

```bash
./scripts/setup.sh                      # clé d'API Arcads + MASTER_CONTEXT.md + sync des skills
./scripts/fetch-arcads-references.sh    # (optionnel) bibliothèque d'images de référence (~119 Mo)
```

Puis ouvrez le dossier dans Claude Code ou Cursor et demandez par exemple :
« Génère une vidéo UGC Seedance de 12 secondes pour ce produit ».

- 📖 Documentation complète du pack : **[ARCADS-SKILL-PACK.md](ARCADS-SKILL-PACK.md)**
- 🔑 Clé d'API : [app.arcads.ai/settings/api](https://app.arcads.ai/settings/api) — stockée dans `.env` (jamais versionnée)
- ✅ Vérifier la configuration : `./scripts/check-arcads-env.sh`
- 🔄 Après modification d'un skill : `./scripts/sync-skill.sh`

Les skills sources vivent dans `skills/` et `shared/skills/` ; un hook `SessionStart`
(`.claude/settings.json`) les recopie automatiquement vers `.claude/skills/` et
`.cursor/skills/` (dossiers générés, non versionnés) à chaque ouverture de session.
