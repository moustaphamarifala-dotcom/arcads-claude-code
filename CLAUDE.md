@shared/CLAUDE.md

# Arcads-specific session rules

- **API:** Arcads external API (`https://external-api.arcads.ai`).
- **Auth:** HTTP Basic via `ARCADS_BASIC_AUTH` or `ARCADS_API_KEY`. Setup check: `./scripts/check-arcads-env.sh`.
- **Skill:** `.claude/skills/arcads-external-api/SKILL.md` for API calls, prompts, and polling.
- **YouTube thumbnails:** `.claude/skills/generate-youtube-thumbnail/SKILL.md` (uses the Nano Banana 2 image endpoint via Arcads).
- **Image-ad ecosystem (Meta image creatives):** read `shared/skills/image-ad-prompting/OVERVIEW.md` FIRST. Three skills (`chatgpt-image-ad`, `nano-banana-image-ad`, `image-ad-clone`) + a shared 37-template prompt library. The `image-ad-clone` skill asks which backend to validate against at Phase 1, so generic "clone this ad" prompts route correctly. Output is image files; Meta upload is the separate `meta-ad-builder` skill.
- **Cost disclosure:** Always present credit totals as **estimates** — Arcads has no billing endpoint. Tell the user to confirm exact pricing in the Arcads platform.
- **Logging:** Log every generation call to `logs/arcads-api.jsonl`.
- **Sans clé Arcads :** l'API Arcads est payante. Pour les créas **image** uniquement, `./scripts/generate-image-ad-gemini.py` rejoue la bibliothèque de 37 templates (`shared/skills/image-ad-prompting/prompting/prompt-library.md`) sur l'API Gemini avec `GOOGLE_API_KEY` (quota gratuit). Mêmes garde-fous que les skills Arcads. Aucune route gratuite n'existe pour la vidéo — ne pas en promettre une.
- **First-time setup:** If `.env` is missing, run `./scripts/setup.sh`. If `MASTER_CONTEXT.md` is missing, copy `MASTER_CONTEXT.template.md` to `MASTER_CONTEXT.md`.

# Ce dépôt héberge aussi une application Next.js

Ce dépôt contient **deux choses indépendantes** :

1. **Le Studio de Génération de Contenu IA** (application Next.js) — `app/`, `public/`,
   `package.json`, `next.config.mjs`, `.github/workflows/pages.yml`. Voir `README.md`.
2. **Le pack de skills Arcads** installé depuis
   [krusemediallc/arcads-claude-code](https://github.com/krusemediallc/arcads-claude-code) —
   `skills/`, `shared/`, `scripts/`, `references/`, `MASTER_CONTEXT.template.md`.
   Voir `ARCADS-SKILL-PACK.md`.

Les deux ne partagent aucun code. Une tâche qui touche l'application Next.js ne doit pas
modifier `skills/` ni `shared/`, et inversement. Les clés d'API des deux mondes cohabitent
dans le même `.env` (voir `.env.example`).
