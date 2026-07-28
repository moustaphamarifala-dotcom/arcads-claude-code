# 🚀 Démarrer l'application

L'application fonctionne **sans aucune clé API** et **sans compte**.
Il faut juste **Node.js 18.18 ou plus récent** ([télécharger ici](https://nodejs.org)).

## En un clic

- **Mac** : double-cliquez sur `demarrer.command`
- **Windows** : double-cliquez sur `demarrer.bat`

Le navigateur s'ouvre tout seul sur l'application. Pour arrêter, fermez la fenêtre noire.

## Ou en ligne de commande

```bash
npm install     # une seule fois, la première fois
npm run dev
```

Puis ouvrez **http://localhost:3000**

## Les pages

| Adresse | Ce que ça fait |
|---|---|
| `/` | Le studio : textes, images, vidéos |
| `/personnes` | **Fiches personnalités** — biographie, parcours, œuvres, comptes officiels (Wikipédia + Wikidata) |
| `/intel` | **Intel** — revue de presse analysée, grille mercato ou grille investigation |
| `/photo` | Studio photo ultra-réaliste |
| `/couture` | Studio couture bazin |
| `/business.html` | Gestion business |

## Pour aller plus loin (optionnel)

Créez un fichier `.env.local` à côté de ce fichier pour activer les moteurs premium :

```
ANTHROPIC_API_KEY=votre-clé     # analyses Intel et textes rédigés par Claude
REPLICATE_API_TOKEN=votre-jeton # images et vidéos haute qualité
GOOGLE_API_KEY=votre-clé        # Studio Couture Bazin
```

Sans ces clés, tout fonctionne quand même — en version gratuite.

## Bon à savoir

Les fiches et les analyses s'appuient sur des **sources publiques** (Wikipédia, Wikidata, presse en ligne).
Elles peuvent être incomplètes ou datées : vérifiez toujours à la source avant de publier quoi que ce soit.
