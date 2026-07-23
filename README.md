# 🎨 Studio de Génération de Contenu IA

Application web de génération de contenu par intelligence artificielle : **textes**, **images** et **vidéos**, dans une interface simple en français.

## Fonctionnalités

| Onglet | Description | Moteur IA |
|---|---|---|
| ✍️ **Textes** | Articles de blog, posts réseaux sociaux, pubs, scripts vidéo, emails, fiches produits — avec choix du ton, affichage en streaming temps réel | Claude (Anthropic) |
| 🎨 **Images** | Génération d'images à partir d'une description, choix du format (carré, paysage, story…) | FLUX Schnell (via Replicate) |
| 🎬 **Vidéos** | Génération de courtes vidéos à partir d'un texte, avec suivi de progression | WAN 2.1 (via Replicate) |

## Prérequis

- Node.js 18.18 ou plus récent
- Une clé API [Anthropic](https://platform.claude.com) (textes)
- Un jeton API [Replicate](https://replicate.com/account/api-tokens) (images et vidéos)

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les clés API
cp .env.example .env
# puis éditez .env avec vos clés

# 3. Lancer en développement
npm run dev
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

## Coûts indicatifs

- **Textes** : facturés par Anthropic selon les tokens utilisés
- **Images** : ~0,003 $ par image (FLUX Schnell)
- **Vidéos** : quelques centimes par vidéo selon la durée (WAN 2.1)
