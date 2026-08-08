# CLAUDE.md

Guide pour les assistants IA travaillant sur ce dépôt. À lire avant toute modification.

## Le projet en une phrase

**Studio de Génération de Contenu IA** — application Next.js (App Router) en français qui
génère textes, images et vidéos, plus quatre outils annexes (Studio Photo, Studio Couture,
Fiches Personnalités, Intel). Elle **fonctionne sans aucune clé API** et bascule
automatiquement sur des moteurs premium quand des clés sont présentes.

Stack : Next.js 15 · React 19 · TypeScript strict · CSS natif (aucun framework UI, aucune
librairie d'état, aucun test).

---

## Commandes

```bash
npm install          # une seule fois
npm run dev          # http://localhost:3000
npm run build        # build de production (fait aussi le typecheck)
npx tsc --noEmit     # typecheck seul, rapide
```

Lanceurs « double-clic » pour les utilisateurs non techniques : `demarrer.command` (Mac/Linux)
et `demarrer.bat` (Windows). Ils vérifient Node, installent si besoin, ouvrent le navigateur.

### ⚠️ `npm run lint` ne fonctionne pas

Le script existe dans `package.json` mais **ESLint n'est pas installé** et `next lint` est
déprécié (supprimé dans Next 16). La commande ouvre un prompt interactif et bloque.

**Pour vérifier une modification, utiliser `npx tsc --noEmit` puis `npm run build`.**
Ne pas ajouter ESLint sans que ce soit explicitement demandé.

---

## Structure

```
app/
├── layout.tsx                    # layout racine (<html lang="fr">), importe globals.css
├── page.tsx                      # accueil : onglets Textes / Images / Vidéos + liens vers les outils
├── globals.css                   # thème sombre + classes globales partagées
├── components/                   # utilisés UNIQUEMENT par l'accueil
│   ├── TextGenerator.tsx         # streaming texte
│   ├── ImageGenerator.tsx        # image → URL
│   └── VideoGenerator.tsx        # lancement + polling toutes les 5 s
├── photo/      page.tsx + photo.module.css       # Studio Photo (galerie localStorage)
├── couture/    page.tsx + couture.module.css     # Studio Couture Bazin (upload de tissu)
├── intel/      page.tsx + intel.module.css       # revue de presse analysée
├── personnes/  page.tsx + personnes.module.css   # fiches personnalités (favoris localStorage)
└── api/
    ├── generate-text/route.ts    # Claude en streaming ⟷ Pollinations
    ├── generate-image/route.ts   # FLUX Schnell (Replicate) ⟷ Pollinations
    ├── generate-video/route.ts   # WAN 2.1 (Replicate) — POST lance, GET ?id= interroge
    ├── generate-photo/route.ts   # FLUX 1.1 Pro ⟷ Pollinations, renvoie les OCTETS de l'image
    ├── edit-photo/route.ts       # Gemini « Nano Banana », renvoie les OCTETS de l'image
    ├── personnes/route.ts        # Wikipédia + Wikidata, sans clé
    └── intel/route.ts            # Google Actualités RSS + analyse Claude ⟷ Pollinations

public/
├── personnes.html                # « Qui est qui ? » — outil AUTONOME, un seul fichier
└── business.html                 # « Mon Business » — outil AUTONOME, un seul fichier

.github/workflows/pages.yml       # publie public/*.html sur la branche gh-pages
```

---

## La convention centrale : dégradation gracieuse

**Règle absolue du projet : l'application ne doit jamais exiger de clé API pour ce qui peut
s'en passer.** Chaque route qui a un moteur payant teste la variable d'environnement et
retombe sur une alternative gratuite si elle est absente.

| Route | Sans clé (gratuit) | Avec clé (premium) | Variable |
|---|---|---|---|
| `/api/generate-text` | Pollinations.ai | Claude `claude-opus-4-8`, streaming | `ANTHROPIC_API_KEY` |
| `/api/generate-image` | Pollinations.ai | FLUX Schnell (Replicate) | `REPLICATE_API_TOKEN` |
| `/api/generate-photo` | FLUX via Pollinations | FLUX 1.1 Pro (Replicate) | `REPLICATE_API_TOKEN` |
| `/api/intel` | Pollinations.ai | Claude `claude-opus-5` | `ANTHROPIC_API_KEY` |
| `/api/personnes` | Wikipédia + Wikidata | identique | — |
| `/api/generate-video` | ❌ erreur 402 explicative | WAN 2.1 (Replicate) | `REPLICATE_API_TOKEN` |
| `/api/edit-photo` | ❌ erreur 400 explicative | Gemini image | `GOOGLE_API_KEY` |

Les deux exceptions (vidéo, couture) n'ont pas d'alternative gratuite fiable : elles renvoient
un **message d'erreur qui explique quoi faire**, jamais un échec sec.

Forme du test, à reproduire pour toute nouvelle route :

```ts
const token = process.env.REPLICATE_API_TOKEN;
if (!token) return generateFree(prompt, aspectRatio || "1:1");
```

En ajoutant une fonctionnalité, chercher toujours d'abord s'il existe une source publique
sans clé (Wikipédia, Wikidata, flux RSS, Pollinations) avant d'introduire une dépendance payante.

---

## Conventions des routes API

Toutes suivent le même moule :

```ts
export const runtime = "nodejs";
export const maxDuration = 300;   // les générations sont longues
```

- Corps en JSON, validation manuelle en tête de handler, **message d'erreur en français** :
  `return Response.json({ error: "Le champ « prompt » est requis." }, { status: 400 });`
- Codes utilisés : `400` entrée invalide · `402` clé requise pour la vidéo · `404` rien trouvé ·
  `500` exception · `502` service tiers en échec (c'est le code le plus courant : Replicate,
  Google, Pollinations, Wikipédia).
- Les erreurs des services tiers sont **traduites en langage clair** avant d'être renvoyées
  (voir `edit-photo/route.ts` : 429 → « Quota gratuit Google atteint… »). Ne jamais laisser
  fuir un JSON d'erreur brut vers l'utilisateur.
- `Response.json` partout, sauf `personnes/route.ts` qui utilise `NextResponse.json`
  (les deux coexistent, ce n'est pas normalisé).
- Deux routes renvoient les **octets de l'image** et non une URL (`generate-photo`,
  `edit-photo`) : c'est volontaire, ça met l'image en même origine et évite les soucis de
  CORS au téléchargement. Le client fait alors `URL.createObjectURL(blob)`.
- Appels aux APIs Wikimedia et Google Actualités : `User-Agent` identifiable **obligatoire**
  (constante `UA`) et cache via `next: { revalidate: … }` (3600 s Wikipédia, 86400 s Wikidata,
  900 s actualités).

### Usage du SDK Anthropic

`new Anthropic()` sans argument — la clé est lue dans `ANTHROPIC_API_KEY`. Deux styles selon
le besoin :

- `generate-text` : `client.messages.stream()`, `thinking: { type: "adaptive" }`, relayé vers
  le client dans un `ReadableStream` (on ne garde que les `text_delta`), `stream.abort()` sur
  `cancel()`.
- `intel` : `client.beta.messages.create()` avec fallback serveur
  (`betas: ["server-side-fallback-2026-06-01"]`, `fallbacks: [{ model: "claude-opus-4-8" }]`)
  et `output_config: { effort: "high" }`. Le `stop_reason === "refusal"` est traité
  explicitement.

Dans les deux cas le prompt système est marqué `cache_control: { type: "ephemeral" }`.

---

## Conventions côté client

- Toutes les pages et composants interactifs sont `"use client"`. Aucun state manager :
  `useState` / `useRef` / `useEffect` suffisent.
- Trois états systématiques : `loading` (booléen), `error` (`string | null`, en français),
  résultat. Affichage de l'erreur dans une boîte dédiée, jamais de `alert()`.
- Récupération du message d'erreur serveur :
  `const data = await res.json().catch(() => null); throw new Error(data?.error ?? \`Erreur serveur (${res.status})\`);`
- Persistance locale via `localStorage`, toujours dans un `try/catch` (le quota peut sauter) :
  clés `photo.gallery` (galerie, max 8, réduite si le quota déborde) et `personnes.favoris`.
- `<img>` natif partout — **`next/image` n'est utilisé nulle part**. Les `remotePatterns` de
  `next.config.mjs` sont donc inertes aujourd'hui ; les garder ne coûte rien, mais ne pas
  s'appuyer dessus.
- Le polling vidéo nettoie ses `setInterval` dans un `useEffect` de démontage et via
  `stopTimers()`. Reproduire ce soin sur tout nouveau polling.
- Le rendu Markdown d'Intel est un mini-parseur maison (`Markdown` dans `app/intel/page.tsx`) :
  titres, listes, gras. **Ne pas ajouter de dépendance Markdown** pour si peu.

## Styles

- `app/globals.css` : variables CSS du thème sombre (`--bg`, `--accent` orange `#e0762e`,
  `--radius`…) et classes globales partagées par l'accueil et ses composants —
  `.container .panel .field .row .actions .btn .btn-secondary .error-box .result .hint .tab`.
- Chaque sous-page a **son propre CSS Module** (`photo.module.css`, etc.) et n'utilise pas
  les classes globales. Suivre ce découpage pour toute nouvelle page.
- Thème sombre dans l'app Next ; les fichiers autonomes de `public/` gèrent, eux, clair +
  sombre (`prefers-color-scheme` et `:root[data-theme]`).

---

## Les outils autonomes de `public/`

`personnes.html` et `business.html` sont des **fichiers HTML uniques et complets** (styles et
scripts inline, aucune dépendance, aucun build). Ils s'ouvrent d'un double-clic et
fonctionnent sans serveur.

Ne pas les « moderniser » en les découpant ou en leur ajoutant un bundler : leur autonomie
est la fonctionnalité. Une modification s'y fait directement dans le fichier.

### Déploiement GitHub Pages — attention

`.github/workflows/pages.yml` se déclenche sur push vers `main` et publie sur la branche
`gh-pages` **uniquement les fichiers de `public/`** :

- `public/personnes.html` → `index.html` **et** `personnes.html`
- `public/business.html` → `business.html`

**Le site GitHub Pages n'est donc pas l'application Next.js.** L'app complète se déploie
séparément sur Vercel (avec les variables d'environnement). Modifier une page `app/` n'a
aucun effet sur GitHub Pages, et inversement.

---

## Variables d'environnement

Toutes **optionnelles** (voir `.env.example`). En local : `.env.local` (ignoré par git).
Sur Vercel : Settings → Environment Variables.

| Variable | Effet si absente | Effet si présente |
|---|---|---|
| `ANTHROPIC_API_KEY` | textes et Intel via Pollinations | Claude |
| `REPLICATE_API_TOKEN` | images via Pollinations, vidéo indisponible | FLUX + WAN |
| `GOOGLE_API_KEY` (ou `GEMINI_API_KEY`) | `/couture` renvoie une erreur explicative | Studio Couture actif |
| `GEMINI_IMAGE_MODEL` | `gemini-2.5-flash-image` | modèle image Gemini choisi |

---

## Langue et ton

**Tout est en français** : interface, commentaires de code, messages d'erreur, documentation,
messages de commit. Les fichiers récents nomment aussi leurs identifiants en français
(`fiche`, `titre`, `valeurs`, `erreur`, `charge`, `construireFiche`) ; les fichiers d'origine
(`components/`, `generate-*`) sont en anglais (`prompt`, `loading`, `output`). **Suivre la
convention du fichier que l'on modifie**, ne pas renommer l'existant.

Les commentaires expliquent le *pourquoi*, en une ligne, jamais le *quoi* :

```ts
// Google échappe parfois deux fois (« &amp;#39; ») : on repasse jusqu'à stabilité.
// Les suggestions sont un bonus : jamais bloquantes.
```

Typographie française respectée : guillemets `«  »`, apostrophes typographiques,
espaces avant `: ; ! ?`. Dans le JSX, échapper les apostrophes (`&apos;`).

---

## Garde-fous éditoriaux — ne pas les affaiblir

Les pages **Intel** et **Fiches Personnalités** touchent à des personnes réelles. Des règles
sont inscrites dans le code et dans la documentation ; toute modification doit les préserver.

Le prompt système `CADRE` de `app/api/intel/route.ts` impose au modèle de :

- ne s'appuyer **que** sur les articles fournis, et écrire « non renseigné dans ces sources »
  plutôt que d'inventer ;
- distinguer ce qu'un média affirme de ce qui reste une hypothèse, en citant le média ;
- n'accuser personne — une zone d'ombre se formule comme un manque d'information ;
- ne jamais écrire au nom d'un journaliste réel ni signer l'analyse.

Les titres réellement utilisés sont renvoyés au client et affichés sous l'analyse, cliquables :
c'est la traçabilité de l'outil. Les avertissements du `README.md` et de `DEMARRER.md`
(sources publiques, informations possiblement incomplètes ou datées, à vérifier avant
publication) font partie du produit.

En modifiant ces prompts, on retouche la formulation ou les sections, pas ces règles.

---

## Git

- Branche par défaut : `main`. Les commits partent en `gh-pages` automatiquement via le
  workflow (uniquement pour `public/`).
- **Messages de commit en français, à l'impératif ou en substantif**, décrivant la
  fonctionnalité côté utilisateur :
  `Ajout d'Intel : revue de presse analysée (page /intel)` ·
  `Studio Photo : renforcer la netteté des images (mode gratuit)` ·
  `Publication du site sur GitHub Pages`
- `node_modules/`, `.next/`, `.env*` sont ignorés — ne jamais les committer.

---

## Ajouter une nouvelle page : la marche à suivre

1. `app/<nom>/page.tsx` avec `"use client"` + `app/<nom>/<nom>.module.css`.
2. Si elle appelle un service : `app/api/<nom>/route.ts` avec `runtime`/`maxDuration`,
   validation en français, et **un mode gratuit si c'est possible**.
3. Ajouter le lien pilule dans la liste de `app/page.tsx` (même style inline que les autres).
4. Documenter la page dans le tableau du `README.md` **et** dans celui de `DEMARRER.md`.
5. Nouvelle variable d'environnement ? La commenter dans `.env.example` en précisant qu'elle
   est optionnelle et ce qui se passe sans elle.
6. Vérifier : `npx tsc --noEmit` puis `npm run build`.
