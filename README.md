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
| 🎬 **Studio TikTok** (`/tiktok`) | Pollinations.ai | Claude |
| 📊 **Diagnostic des vues, calendrier, accroches** | Sans IA — immédiat | — (identique) |

Le **Studio Photo** (page `/photo`) est un générateur d'images **ultra-réalistes** dédié : styles (portrait, paysage, produit, nourriture…), formats, galerie sauvegardée et téléchargement de chaque image.

**Qui est qui ?** (fichier `public/personnes.html`) est la version **autonome** des fiches personnalités, sur le même principe que *Mon Business* : **un seul fichier HTML**, aucune installation, aucun serveur. Ouvrez-le d'un double-clic et il interroge Wikipédia et Wikidata directement depuis le navigateur (thème clair/sombre, fiches enregistrées en local). Seule une connexion internet est nécessaire.

Les **Fiches Personnalités** (page `/personnes`) permettent de **chercher des informations sur une personnalité publique** : biographie, date et lieu de naissance, âge, nationalité, profession, formation, employeurs, œuvres notables, distinctions, sites et comptes officiels, plus des profils proches à explorer. Les données proviennent de **Wikipédia** (biographie et photo) et de **Wikidata** (faits structurés) — aucune clé API, aucun compte. Les fiches enregistrées restent disponibles dans le navigateur.

> Cet outil ne consulte que des sources publiques et encyclopédiques, et n'a de sens que pour des **personnalités publiques**. Les informations peuvent être incomplètes ou datées : vérifiez toujours à la source avant de publier quoi que ce soit.

**Intel** (page `/intel`) va plus loin que la fiche : il rassemble les **articles de presse récents** sur un sujet (via le flux public de Google Actualités) puis les analyse selon la grille de lecture choisie :

- ⚽ **Mercato** — état du dossier, qui pousse et qui freine, tri entre *confirmé / rapporté / spéculatif*, niveau de solidité de l'info, et ce qui décidera de la suite.
- 🕵️ **Investigation** — ce que disent les sources, qui décide et qui paie, zones d'ombre, questions précises à poser et documents à vérifier.

L'analyse tourne gratuitement sans clé (Pollinations.ai) et bascule sur **Claude** si `ANTHROPIC_API_KEY` est présente. Chaque fiche personnalité propose un bouton « ⚡ Analyser l'actualité » qui ouvre directement Intel sur la bonne personne.

> Intel **résume et questionne des articles existants** : il n'enquête pas, ne révèle rien, n'invente aucun fait et n'écrit au nom d'aucun journaliste. Les titres utilisés sont listés et cliquables sous chaque analyse — vérifiez-les avant de reprendre quoi que ce soit.

Le **Studio TikTok** (page `/tiktok`) est pensé pour un **vendeur** qui filme sa marchandise avec son téléphone — pas pour un créateur de divertissement. La différence tient en une phrase : la vue ne rapporte rien, la commande si. Cent mille vues venues d'un pays où vous ne livrez pas ne valent rien ; deux mille vues chez les bonnes personnes remplissent une semaine.

Tout part d'un **profil de boutique** (ce que vous vendez, où vous livrez, vos prix, comment on commande) rempli une seule fois et conservé dans le navigateur. Il est repris dans chaque vidéo écrite : sans lui, les conseils resteraient des généralités inutilisables.

Sept outils :

- 🎬 **Vidéo produit** — décrivez une pièce, obtenez la vidéo complète prête à tourner : accroche exacte, texte à l'écran, plan par plan minuté, les gestes qui prouvent la qualité à l'image, où placer le prix, l'appel à commander, la légende et les hashtags.
- 💡 **Idées de vidéos** — 5 concepts variés pour la boutique (arrivage, preuve de qualité, rendu porté, coulisses, objection, client servi), avec pour chacun ce que la vidéo prouve à l'acheteur.
- 🎯 **Score de la vidéo** — collez votre script : noté sur 100 sur cinq critères de vendeur (accroche, rétention, **confiance**, envie d'acheter, appel à commander), avec les corrections prioritaires et trois réécritures de l'accroche.
- 📊 **Pourquoi je n'ai pas de vues** — recopiez les statistiques d'une vidéo : le calcul de rétention dit si ça casse à l'accroche ou au milieu, si la vidéo est trop longue, et pourquoi beaucoup de vues peuvent ne produire aucun message. **Sans IA, immédiat.**
- 📅 **Plan 7 jours** — une semaine qui alterne se faire connaître et vendre, car un compte qui ne fait que vendre cesse d'être montré à de nouvelles personnes.
- 🗓️ **Calendrier des ventes** — les saisons (Ramadan et Korité, Tabaski, mariages, baptêmes, fin d'année) et, à partir de la date que vous saisissez, la consigne du moment. **Sans IA, immédiat.**
- 🪝 **Accroches** — 45 accroches classées par mécanique : six familles de vendeur (arrivage, prix, preuve de qualité, rendu porté, confiance, occasion) et trois pour se faire connaître. **Sans IA et sans réseau.**

L'idée qui structure le calendrier mérite d'être soulignée, parce que c'est l'erreur la plus coûteuse : **le pic de commandes ne tombe pas la semaine de la fête, mais plusieurs semaines avant.** L'acheteur doit encore trouver un tailleur, et les tailleurs saturent puis refusent bien avant le jour J. Vendre la semaine de la fête, c'est arriver quand tout est déjà joué.

Les dates des fêtes musulmanes suivent le calendrier lunaire : elles avancent d'environ onze jours par an et dépendent de l'observation de la lune, donc elles varient d'un pays à l'autre. L'application n'en code aucune — vous saisissez la vôtre et tout se calcule à partir d'elle.

> Aucun outil ne peut garantir une vidéo virale, et celui-ci ne le prétend pas. Les seuils du diagnostic sont des repères d'usage, pas des chiffres officiels : TikTok ne publie pas le fonctionnement de son algorithme. Les vidéos écrites par l'IA sont des points de départ à relire avant de tourner — vérifiez que chaque phrase est vraie pour votre marchandise. Une promesse que la livraison ne tient pas coûte un client définitivement, alors qu'une vente ratée ne coûte qu'une vente. L'application refuse par construction de conseiller d'inventer une rupture de stock, d'annoncer une marque ou une qualité que vous n'avez pas, d'inventer un témoignage client ou d'acheter des vues.

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
