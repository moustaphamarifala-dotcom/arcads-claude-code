@shared/CLAUDE.md

# CLAUDE.md — guide du dépôt

Ce fichier oriente les assistants IA (Claude Code, Cursor…) qui travaillent dans ce dépôt.
La ligne `@shared/CLAUDE.md` ci-dessus importe les règles communes du pack de skills
(setup, mémoire projet, ton, communauté). Ce qui suit décrit **ce dépôt précisément**.

## Deux projets indépendants dans un seul dépôt

| | 1. Studio de Génération de Contenu IA | 2. Pack de skills Arcads |
|---|---|---|
| **Quoi** | Application web Next.js 15 / React 19, en français | Instructions pour un agent IA qui pilote des APIs génératives |
| **Chemins** | `app/`, `public/`, `package.json`, `next.config.mjs`, `tsconfig.json`, `.github/workflows/pages.yml` | `skills/`, `shared/`, `scripts/`, `references/`, `logs/`, `MASTER_CONTEXT.template.md` |
| **Doc** | `README.md` | `ARCADS-SKILL-PACK.md`, `AGENTS.md` |
| **Origine** | écrit ici | installé depuis [krusemediallc/arcads-claude-code](https://github.com/krusemediallc/arcads-claude-code) (MIT — `LICENSE-arcads-skill-pack`) |

**Les deux ne partagent aucun code.** Une tâche qui touche l'application Next.js ne doit pas
modifier `skills/` ni `shared/`, et inversement. Seul point commun : les clés d'API cohabitent
dans le même `.env` (voir `.env.example`), et `GOOGLE_API_KEY` sert aux deux
(page `/couture` **et** `scripts/generate-image-ad-gemini.py`).

---

# Partie 1 — L'application Next.js

## Commandes

```bash
npm install            # Node.js 18.18+
npm run dev            # http://localhost:3000
npm run build          # build de production
npm start              # serveur de production
npx tsc --noEmit       # vérification de types (à lancer avant de livrer)
```

Il n'y a **ni suite de tests ni configuration ESLint** dans le dépôt : `npm run lint`
(`next lint`) n'est pas utilisable en l'état. Le seul contrôle automatique disponible est
`npx tsc --noEmit` (TypeScript `strict: true`). Ne pas prétendre qu'un test est passé.

## Structure

```
app/
├── layout.tsx, page.tsx, globals.css   # accueil à onglets (Textes / Images / Vidéos)
├── components/{Text,Image,Video}Generator.tsx
├── photo/      + photo.module.css      # Studio Photo ultra-réaliste
├── couture/    + couture.module.css    # Studio Couture Bazin (Nano Banana / Gemini)
├── personnes/  + personnes.module.css  # Fiches personnalités (Wikipédia + Wikidata)
├── intel/      + intel.module.css      # Revue de presse analysée
└── api/<nom>/route.ts                  # une route par fonctionnalité
public/
├── personnes.html, business.html       # outils autonomes, un seul fichier HTML, zéro build
```

Câblage page → route : `page.tsx` → `generate-text|image|video`, `/photo` → `generate-photo`,
`/couture` → `edit-photo`, `/personnes` → `personnes`, `/intel` → `intel`.

## Conventions des routes API

- App Router, `export const runtime = "nodejs"` ; `export const maxDuration = 300` pour tout
  ce qui appelle un modèle (toutes les routes sauf `personnes`).
- **Dégradation gracieuse, pas d'échec :** sans clé, la route bascule sur une alternative
  gratuite plutôt que de renvoyer une erreur. Texte et image → Pollinations.ai ; vidéo → pas
  d'alternative gratuite, la route renvoie **402** avec une explication. Conserver ce
  comportement en modifiant une route.
- **Messages d'erreur en français**, adressés à un utilisateur non technique, et disant quoi
  faire (« Ajoute `GOOGLE_API_KEY` dans… puis redéploie »).
- Réponses : `Response.json({...})` ; texte en flux via `ReadableStream`
  (`text/plain; charset=utf-8`) ; la vidéo est asynchrone → `POST` lance, `GET ?id=…` sonde.
- Les identifiants de modèles sont des constantes en haut de fichier
  (`flux-schnell`, `flux-1.1-pro`, `wan-2.1-1.3b`, `gemini-2.5-flash-image`, `claude-opus-4-8`) :
  les changer là, pas au milieu du code.
- Aucune clé n'est jamais renvoyée au client ; tout appel externe part du serveur.
- Les APIs Wikimedia exigent un `User-Agent` identifiable (constante `UA`) — le garder.

## Style

- **Toute l'interface, les commentaires et la documentation de l'app sont en français**
  (y compris les noms de variables métier dans `api/personnes` et `api/intel`).
- CSS Modules par page (`*.module.css`) + variables globales dans `app/globals.css`.
  Pas de framework CSS, pas de librairie de composants.
- Composants clients (`"use client"`) uniquement là où il y a de l'état ; le reste est serveur.

## Déploiement

- **Vercel** pour l'application complète (variables d'env dans Settings → Environment Variables).
- **GitHub Pages** pour les deux fichiers autonomes : `.github/workflows/pages.yml` se
  déclenche sur `push` vers `main`, copie `public/personnes.html` (→ `index.html`) et
  `public/business.html` dans une branche `gh-pages` réécrite en force. L'app Next.js n'est
  **pas** publiée par ce workflow. Toucher `public/*.html` = changer le site publié.

---

# Partie 2 — Le pack de skills Arcads

## Architecture des skills

- **Sources canoniques** (versionnées, à éditer) :
  - `skills/<nom>/SKILL.md` (+ `scripts/`) — skills propres à l'API Arcads.
  - `shared/skills/<nom>/` — contenu propagé depuis l'amont : `prompting/`, `reference/`,
    parfois `scripts/`. Un seul y porte un `SKILL.md` : `meta-ad-builder`.
- **Copies générées** (gitignorées, jamais éditées) : `.claude/skills/` et `.cursor/skills/`.
  `shared/scripts/sync-skill.sh` recopie chaque dossier contenant un `SKILL.md`
  (`rm -rf` puis `cp -R`) — **toute modification faite dans `.claude/skills/` est perdue.**
- Après édition d'un skill : `./scripts/sync-skill.sh` (fin wrapper vers `shared/scripts/`).
  Le hook `SessionStart` de `.claude/settings.json` le lance déjà à chaque session, suivi de
  `shared/scripts/check-context.sh` (bannière d'orientation + alerte si le dépôt est en retard
  sur `origin`).
- Les `SKILL.md` de `skills/` référencent le contenu partagé en relatif
  (`../../shared/skills/…`). **Ce chemin ne se résout que depuis `skills/<nom>/`** : depuis la
  copie `.claude/skills/<nom>/` il pointerait vers `.claude/shared/…`, qui n'existe pas. En
  suivant un lien d'un skill, lire la source canonique sous `skills/` ou `shared/skills/`.
- `shared/skills/{caption-video,claymation-ad,gemini-omni-flash,pixar-style-ad,chatgpt-image-ad,nano-banana-image-ad,image-ad-clone,generate-youtube-thumbnail,image-ad-prompting}`
  n'ont pas de `SKILL.md` : ce sont des guides de prompting (et quelques scripts) consommés
  par les skills de `skills/`, pas des skills activables.

## Skills disponibles

| Skill | Rôle |
|---|---|
| `skills/arcads-external-api/` | Skill principal : endpoints, auth, polling, bibliothèques de prompts par modèle (Seedance 2.0, Sora 2, Veo 3.1, Kling, Nano Banana), plus les sous-workflows `analyze-video` et `clone-ad`. |
| `skills/chatgpt-image-ad/` | Créas image Meta via `gpt-image-2` (typographie, imitation d'UI). |
| `skills/nano-banana-image-ad/` | Créas image Meta via `nano-banana-2` / `-pro` / `-edit` (photoréaliste, lifestyle, multi-référence). |
| `skills/image-ad-clone/` | Rétro-ingénierie d'une pub existante en template réutilisable ; demande le backend de validation en Phase 1. |
| `skills/generate-youtube-thumbnail/` | Miniatures YouTube (5 formules CTR) sur l'endpoint image Nano Banana 2. |
| `shared/skills/meta-ad-builder/` | Publication des créas comme publicités Meta **en pause** via l'API Marketing. |

**Écosystème image-ad :** lire `shared/skills/image-ad-prompting/OVERVIEW.md` **avant** toute
tâche de créa image — arbre de décision gpt-image-2 vs Nano Banana, bibliothèque de
37 templates (`prompting/prompt-library.md`), 3 garde-fous obligatoires
(`prompting/safety-suffixes.md`), format d'entrée (`prompting/template-format.md`).
Ces skills produisent **des fichiers image uniquement** ; l'upload vers Meta est le rôle
séparé de `meta-ad-builder`.

## API, auth et coûts

- **API :** Arcads external API (`https://external-api.arcads.ai`, surchargeable par `ARCADS_BASE_URL`).
- **Auth :** HTTP Basic via `ARCADS_BASIC_AUTH` (en-tête déjà encodé, recommandé) ou
  `ARCADS_API_KEY`. Valeurs **entre guillemets simples** dans `.env` (caractères spéciaux).
  Vérification : `./scripts/check-arcads-env.sh` (`GET /v1/products` → 200 attendu).
- **Coûts :** toujours présenter les crédits comme des **estimations** — Arcads n'expose aucun
  endpoint de facturation. Dire à l'utilisateur de confirmer le prix exact dans la plateforme.
  Baser l'estimation sur les `creditsCharged` réellement enregistrés dans `logs/arcads-api.jsonl`,
  pas sur une table en dur.
- **Logging :** journaliser chaque appel de génération dans `logs/arcads-api.jsonl`
  (schéma dans `logs/README.md`). Ce fichier **est** versionné. N'y écrire ni clé, ni en-tête
  d'autorisation, ni prompt complet (stocker un nombre de mots).

## Scripts

| Script | Rôle |
|---|---|
| `scripts/setup.sh` | Setup initial : crée `.env`, valide la clé Arcads (saisie masquée), crée `MASTER_CONTEXT.md`, synchronise les skills, teste la connexion. |
| `scripts/check-arcads-env.sh` | Test de connectivité Arcads, sans afficher de secret. |
| `scripts/sync-skill.sh` | Wrapper → `shared/scripts/sync-skill.sh`. |
| `scripts/fetch-arcads-references.sh` | Télécharge la bibliothèque de médias de référence (~119 Mo) depuis l'amont vers `references/` (jamais écrasée, jamais versionnée). |
| `scripts/generate-image-ad-gemini.py` | Route **sans clé Arcads** : rejoue les 37 templates sur l'API Gemini avec `GOOGLE_API_KEY`. Stdlib Python 3 uniquement. |
| `shared/scripts/check-context.sh` | Bannière `SessionStart`. |
| `shared/skills/meta-ad-builder/scripts/*.py` | Déploiement Meta, pull des top ads / ads concurrentes (`requirements.txt` à part). |

**Sans clé Arcads :** l'API Arcads est payante. Pour les créas **image** seulement,
`./scripts/generate-image-ad-gemini.py` (`--list`, `--show T7`, `--dry-run`, `--template`,
`--var`, `--image-ref`, `--n`) applique les mêmes garde-fous que les skills et accepte même des
ratios refusés par Arcads (`4:5`, `2:3`). Sortie dans `outputs/image-ads/` (non versionné).
**Aucune route gratuite n'existe pour la vidéo — ne pas en promettre une.**

## Mémoire projet

- Lire `MASTER_CONTEXT.md` au début de toute session substantielle (voix de marque, produit par
  défaut, coûts crédits, apprentissages API). S'il manque : copier `MASTER_CONTEXT.template.md`.
- Champs vides → proposer de les remplir et **réécrire les valeurs dans le fichier**.
- Après un changement significatif : ajouter une entrée datée au Changelog
  (Décision / Ce qui change / Pourquoi).
- `MASTER_CONTEXT.md` est gitignoré : c'est la mémoire locale de l'utilisateur, pas du dépôt.

---

# Conventions communes

## Fichiers générés ou locaux — ne pas versionner, ne pas éditer

`node_modules/`, `.next/`, `out/` · `.env`, `.env*.local` · `MASTER_CONTEXT.md` ·
`.claude/skills/`, `.cursor/skills/`, `.claude/settings.local.json` · `references/**`
(sauf `README.md` et les `.gitkeep`) · `outputs/`, `output/`, `*.log`, `__pycache__/`.

`AGENTS.md` est **auto-généré** en amont (« DO NOT EDIT ») ; son bloc spécifique au dépôt vient
d'un `AGENTS.tail.md` qui n'existe pas ici. Modifier `CLAUDE.md` plutôt qu'`AGENTS.md`, et
répercuter à la main si les deux doivent rester alignés.

## Secrets

Aucune clé dans le code, les commits, les logs ou le chat. Tout passe par `.env`
(`chmod 600` posé par `setup.sh`). `.env.example` documente chaque variable :
`ANTHROPIC_API_KEY`, `REPLICATE_API_TOKEN`, `GOOGLE_API_KEY` / `GEMINI_IMAGE_MODEL`,
`ARCADS_BASIC_AUTH` / `ARCADS_API_KEY` / `ARCADS_CLIENT_ID` / `ARCADS_BASE_URL`,
`META_ACCESS_TOKEN` / `META_AD_ACCOUNT_ID` / `META_PAGE_ID` / `META_IG_USER_ID` /
`META_PIXEL_ID` / `META_API_VERSION`. Toutes sont **optionnelles** : sans aucune clé,
l'application tourne en mode gratuit.

## Git

- Branche par défaut : `main`. Un push sur `main` republie le site GitHub Pages.
- Messages de commit **en français**, à l'impératif, une ligne de résumé
  (ex. « Ajoute une route Gemini pour les créas image »).
- Ne jamais committer un dossier généré ni un fichier de `references/`.

## Premier lancement

- `.env` absent → `./scripts/setup.sh`.
- `MASTER_CONTEXT.md` absent → copier `MASTER_CONTEXT.template.md`.
- Pour l'app seule, rien n'est requis : `npm install && npm run dev` suffit.
