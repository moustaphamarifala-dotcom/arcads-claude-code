#!/usr/bin/env python3
"""
Génère des créas publicitaires statiques via l'API Gemini (Nano Banana) en
utilisant la bibliothèque de prompts du pack de skills Arcads.

Pourquoi ce script : les skills `chatgpt-image-ad` et `nano-banana-image-ad`
passent par l'API Arcads, qui demande un abonnement payant. La bibliothèque de
37 templates (`shared/skills/image-ad-prompting/prompting/prompt-library.md`),
elle, n'est que du texte — indépendante du fournisseur. Ce script la branche
directement sur l'API Gemini de Google, avec la même clé `GOOGLE_API_KEY` que
la page /couture de l'application Next.js de ce dépôt.

Ce que ça ne remplace pas : la vidéo. Ce script ne fait que des images.

Exemples :
  # Voir les 37 templates disponibles
  ./scripts/generate-image-ad-gemini.py --list

  # Lire un template en entier (variables, prompt, notes de rendu)
  ./scripts/generate-image-ad-gemini.py --show T7

  # Vérifier le prompt final sans appeler l'API (aucun quota consommé)
  ./scripts/generate-image-ad-gemini.py --template T7 \
      --var brand.name=Kaba --var product_description="sachet doré" --dry-run

  # Générer, avec une photo produit en référence
  ./scripts/generate-image-ad-gemini.py --template T7 \
      --var brand.name=Kaba --image-ref references/products/kaba.jpg --n 2

  # Prompt libre, sans template
  ./scripts/generate-image-ad-gemini.py --prompt "affiche 4:5 pour un savon artisanal"

Sortie :
  stdout : un objet JSON par image générée (chemin du fichier, template, ratio)
  stderr : progression et erreurs, en clair
  code   : 0 si au moins une image est produite, 1 si tout échoue, 2 si arguments invalides

Stdlib uniquement — aucun `pip install`.
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIBRARY = ROOT / "shared/skills/image-ad-prompting/prompting/prompt-library.md"
API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_MODEL = "gemini-2.5-flash-image"
MAX_REFS = 14
TIMEOUT_S = 180

# Les trois garde-fous toujours actifs du pack, repris mot pour mot de
# shared/skills/image-ad-prompting/prompting/safety-suffixes.md.
NO_CHROME_SUFFIX = (
    "\n\n[NO PLATFORM CHROME] Render only the standalone ad creative (the static image uploaded to Meta), "
    "not a screenshot of how it displays in-feed. Exclude: iOS device chrome (status bar, home indicator); "
    "platform brand-row above the ad (avatar + handle + Sponsored / Saved label); post body / caption text; "
    "link-card footer (URL + headline + button); engagement rows (likes / comments / shares counts, "
    "Followed-by, View comments); action buttons (Like / Comment / Share / Save); comment input boxes; "
    "platform tab/nav bars (Instagram, Facebook, Twitter); Story chrome (progress bars, story header, "
    "swipe-up arrows). Just the standalone image."
)

SAFE_ZONE_SUFFIX = (
    "\n\n[EDGE-SAFE] All text, headlines, CTAs, table headers, sign/board content, product wordmarks, and "
    "key focal subjects must fit within the central 84% of the canvas (~8% padding from every edge). "
    "Backgrounds and divider lines may bleed; text and focal elements may NOT touch or extend off any edge. "
    "If a tall focal subject doesn't fit at the requested aspect ratio, scale it DOWN — never crop a "
    "headline, never let text run off-frame, never cut off the top/bottom of a sign, board, or product."
)

GLYPH_SAFETY_SUFFIX = (
    "\n\n[TEXT FIDELITY] Inside body-text blocks (chat bubbles, message threads, comment text, ChatGPT "
    "responses, dense paragraphs): plain words only — NO emoji, NO unicode glyphs, NO special characters "
    "mid-sentence. Emoji OK in headlines and short large-text positions where the prompt explicitly calls "
    "for them. Render the EXACT count of conversation elements the prompt specifies — do not invent "
    "additional comments, messages, replies, or responses."
)


# ── .env ─────────────────────────────────────────────────────────────────────

def load_env() -> None:
    """Charge .env sans écraser les variables déjà présentes dans l'environnement."""
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = value


# ── Bibliothèque de prompts ──────────────────────────────────────────────────

class Template:
    def __init__(self, tid: str, title: str, body: str):
        self.id = tid
        self.title = title
        self.body = body

    @property
    def aspect_ratio(self) -> str:
        m = re.search(r"\*\*Aspect ratio:\*\*\s*`([^`]+)`", self.body)
        return m.group(1) if m else "1:1"

    @property
    def prompt(self) -> str:
        """Le premier bloc de code après le marqueur '**Template prompt'."""
        m = re.search(r"^\*\*Template prompt.*?^```\w*\n(.*?)^```", self.body, re.S | re.M)
        return m.group(1).strip() if m else ""

    @property
    def variables(self) -> list[str]:
        return sorted(set(re.findall(r"\{([a-zA-Z0-9_.\[\]]+)\}", self.prompt)))

    @property
    def nano_note(self) -> str:
        m = re.search(r"^-\s*\*\*nano-banana:?\*\*:?\s*(.+)$", self.body, re.M)
        return m.group(1).strip() if m else ""


def load_templates() -> "dict[str, Template]":
    if not LIBRARY.exists():
        sys.exit(f"Bibliothèque introuvable : {LIBRARY}\n"
                 "Le pack de skills Arcads est-il bien installé ?")
    text = LIBRARY.read_text(encoding="utf-8")
    parts = re.split(r"^## (T\d+) — (.+)$", text, flags=re.M)
    templates: dict[str, Template] = {}
    # parts = [avant, id, titre, corps, id, titre, corps, ...]
    for i in range(1, len(parts) - 2, 3):
        tid, title, body = parts[i], parts[i + 1].strip(), parts[i + 2]
        templates[tid] = Template(tid, title, body)
    return templates


def cmd_list(templates: "dict[str, Template]") -> None:
    print(f"{len(templates)} templates — bibliothèque du pack Arcads, utilisables ici via Gemini\n")
    print(f"{'ID':<5} {'Ratio':<6} Titre")
    print("-" * 78)
    for tid, t in sorted(templates.items(), key=lambda kv: int(kv[0][1:])):
        print(f"{tid:<5} {t.aspect_ratio:<6} {t.title}")
    print("\nDétail d'un template : --show T7")
    print("Note : Gemini accepte tous ces ratios, y compris 4:5 et 2:3 que l'API Arcads refuse.")


def cmd_show(t: Template) -> None:
    print(f"# {t.id} — {t.title}")
    print(f"\nRatio recommandé : {t.aspect_ratio}")
    if t.nano_note:
        print(f"Rendu Nano Banana (d'après le pack) : {t.nano_note}")
    if t.variables:
        print("\nVariables à remplir (--var nom=valeur) :")
        for v in t.variables:
            print(f"  - {v}")
    else:
        print("\nAucune variable : le prompt est utilisable tel quel.")
    print("\n--- Prompt ---")
    print(t.prompt)


# ── Construction du prompt ───────────────────────────────────────────────────

def fill(prompt: str, variables: "dict[str, str]") -> str:
    for key, value in variables.items():
        prompt = prompt.replace("{" + key + "}", value)
    return prompt


def build_prompt(base: str, args: argparse.Namespace) -> str:
    prompt = base
    if not args.allow_chrome:
        prompt += NO_CHROME_SUFFIX
    if not args.no_safe_zone:
        prompt += SAFE_ZONE_SUFFIX
    if not args.no_glyph_safety:
        prompt += GLYPH_SAFETY_SUFFIX
    return prompt


# ── Appel API ────────────────────────────────────────────────────────────────

def encode_ref(path: Path) -> dict:
    if not path.exists():
        sys.exit(f"Image de référence introuvable : {path}")
    mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return {"inline_data": {"mime_type": mime, "data": data}}


def generate(prompt: str, refs: "list[dict]", model: str, key: str) -> bytes:
    """Un appel = une image. Renvoie les octets, ou lève RuntimeError avec un message clair."""
    body = {
        "contents": [{"parts": [{"text": prompt}] + refs}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }
    req = urllib.request.Request(
        f"{API_BASE}/{model}:generateContent?key={key}",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:400]
        if e.code == 400 and "API key not valid" in detail:
            raise RuntimeError("Clé Google invalide. Vérifie GOOGLE_API_KEY dans .env.") from None
        if e.code == 429:
            raise RuntimeError(
                "Quota Google atteint. Attends quelques minutes, ou active la facturation "
                "dans Google AI Studio."
            ) from None
        if e.code == 404:
            raise RuntimeError(
                f"Modèle « {model} » indisponible pour ta clé. Essaie --model gemini-2.5-flash-image."
            ) from None
        raise RuntimeError(f"Erreur Google ({e.code}) : {detail}") from None
    except urllib.error.URLError as e:
        raise RuntimeError(f"Réseau injoignable : {e.reason}") from None

    parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    for part in parts:
        inline = part.get("inlineData") or part.get("inline_data")
        if inline and inline.get("data"):
            return base64.b64decode(inline["data"])

    text = " ".join(p.get("text", "") for p in parts).strip()
    raise RuntimeError(text or "Le modèle n'a renvoyé aucune image (demande probablement refusée).")


# ── main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    p = argparse.ArgumentParser(
        description="Créas publicitaires via Gemini, à partir de la bibliothèque de prompts du pack Arcads.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--list", action="store_true", help="Lister les templates disponibles.")
    p.add_argument("--show", metavar="ID", help="Afficher un template en entier (ex. T7).")
    p.add_argument("--template", metavar="ID", help="Template à utiliser (ex. T7).")
    p.add_argument("--prompt", help="Prompt libre, à la place d'un template.")
    p.add_argument("--var", action="append", default=[], metavar="NOM=VALEUR",
                   help="Remplit une variable du template. Répétable.")
    p.add_argument("--image-ref", action="append", default=[], metavar="CHEMIN",
                   help=f"Image de référence (photo produit…). Répétable, max {MAX_REFS}.")
    p.add_argument("--n", type=int, default=1, help="Nombre de variantes à générer (défaut 1).")
    p.add_argument("--out-dir", default="outputs/image-ads", help="Dossier de sortie.")
    p.add_argument("--model", default=os.environ.get("GEMINI_IMAGE_MODEL", DEFAULT_MODEL),
                   help=f"Modèle Gemini (défaut {DEFAULT_MODEL}).")
    p.add_argument("--dry-run", action="store_true",
                   help="Afficher le prompt final sans appeler l'API.")
    p.add_argument("--allow-unfilled", action="store_true",
                   help="Générer même s'il reste des variables non remplies.")
    p.add_argument("--allow-chrome", action="store_true",
                   help="Ne pas ajouter le garde-fou anti-chrome (rare).")
    p.add_argument("--no-safe-zone", action="store_true",
                   help="Ne pas ajouter le garde-fou de marge de sécurité.")
    p.add_argument("--no-glyph-safety", action="store_true",
                   help="Ne pas ajouter le garde-fou anti-emoji dans les blocs de texte.")
    args = p.parse_args()

    load_env()
    templates = load_templates()

    if args.list:
        cmd_list(templates)
        return 0

    if args.show:
        t = templates.get(args.show.upper())
        if not t:
            print(f"Template inconnu : {args.show}. Utilise --list.", file=sys.stderr)
            return 2
        cmd_show(t)
        return 0

    if not args.template and not args.prompt:
        p.print_help()
        return 2
    if args.template and args.prompt:
        print("Choisis --template OU --prompt, pas les deux.", file=sys.stderr)
        return 2
    if args.n < 1:
        print("--n doit valoir au moins 1.", file=sys.stderr)
        return 2
    if len(args.image_ref) > MAX_REFS:
        print(f"Maximum {MAX_REFS} images de référence.", file=sys.stderr)
        return 2

    variables: dict[str, str] = {}
    for item in args.var:
        if "=" not in item:
            print(f"--var attend NOM=VALEUR, reçu : {item}", file=sys.stderr)
            return 2
        name, _, value = item.partition("=")
        variables[name.strip().strip("{}")] = value

    if args.template:
        t = templates.get(args.template.upper())
        if not t:
            print(f"Template inconnu : {args.template}. Utilise --list.", file=sys.stderr)
            return 2
        if not t.prompt:
            print(f"{t.id} n'a pas de prompt exploitable dans la bibliothèque.", file=sys.stderr)
            return 2
        base, label, ratio = fill(t.prompt, variables), t.id, t.aspect_ratio
    else:
        base, label, ratio = fill(args.prompt, variables), "libre", ""

    remaining = sorted(set(re.findall(r"\{([a-zA-Z0-9_.\[\]]+)\}", base)))
    if remaining:
        print(f"Variables non remplies : {', '.join(remaining)}", file=sys.stderr)
        if not args.allow_unfilled:
            print("Remplis-les avec --var nom=valeur, ou force avec --allow-unfilled.", file=sys.stderr)
            return 2
        print("--allow-unfilled : le modèle recevra les accolades telles quelles.", file=sys.stderr)

    final_prompt = build_prompt(base, args)

    if args.dry_run:
        print(final_prompt)
        print(f"\n--- {len(final_prompt)} caractères | template {label}"
              f"{' | ratio ' + ratio if ratio else ''}"
              f" | {len(args.image_ref)} référence(s) | aucun appel API ---", file=sys.stderr)
        return 0

    key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not key:
        print("GOOGLE_API_KEY manquante. Ajoute-la dans .env — clé gratuite sur "
              "https://aistudio.google.com/apikey", file=sys.stderr)
        return 2

    refs = [encode_ref(Path(r)) for r in args.image_ref]
    out_dir = ROOT / args.out_dir if not Path(args.out_dir).is_absolute() else Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    ok = 0
    for i in range(1, args.n + 1):
        print(f"[{i}/{args.n}] génération via {args.model}…", file=sys.stderr)
        try:
            image = generate(final_prompt, refs, args.model, key)
        except RuntimeError as e:
            print(f"[{i}/{args.n}] échec : {e}", file=sys.stderr)
            continue
        path = out_dir / f"{label.lower()}-{stamp}-{i}.png"
        path.write_bytes(image)
        ok += 1
        print(json.dumps({
            "file": str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path),
            "template": label,
            "aspect_ratio": ratio,
            "model": args.model,
            "bytes": len(image),
        }, ensure_ascii=False))

    if ok == 0:
        return 1
    print(f"\n{ok}/{args.n} image(s) dans {out_dir}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
