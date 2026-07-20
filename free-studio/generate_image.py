#!/usr/bin/env python3
"""Free Studio — génération d'images Nano Banana via l'API Google Gemini (quota gratuit).

Usage :
  python3 generate_image.py --prompt "Une photo publicitaire de ..." [options]

Options :
  --prompt TEXT        Le prompt de l'image (obligatoire)
  --ref FICHIER        Image de référence (produit, visage...) — répétable jusqu'à 3 fois
  --out FICHIER        Chemin de sortie (défaut : outputs/img-<horodatage>.png)
  --model NOM          Modèle (défaut : gemini-2.5-flash-image = Nano Banana)
  --count N            Nombre de variantes à générer (défaut : 1)

Clé API : gratuite sur https://aistudio.google.com/apikey
À mettre dans le fichier .env à la racine du repo :  GEMINI_API_KEY=...
Aucune dépendance à installer — Python 3.10+ seulement.
"""

import argparse
import base64
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))
API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-image")


def load_env_key():
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key.strip()
    env_path = os.path.join(ROOT, ".env")
    if os.path.exists(env_path):
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("GEMINI_API_KEY="):
                    return line.split("=", 1)[1].strip().strip("'\"")
    return None


def encode_ref(path):
    mime, _ = mimetypes.guess_type(path)
    if mime is None or not mime.startswith("image/"):
        sys.exit(f"Référence non reconnue comme image : {path}")
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode("ascii")
    return {"inline_data": {"mime_type": mime, "data": data}}


def generate(key, model, prompt, refs):
    parts = [encode_ref(r) for r in refs]
    parts.append({"text": prompt})
    body = json.dumps({
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{API_BASE}/{model}:generateContent",
        data=body,
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        if e.code == 429:
            sys.exit("Quota gratuit épuisé pour aujourd'hui (HTTP 429). "
                     "Réessayez demain — le quota se réinitialise chaque jour.")
        if e.code in (401, 403):
            sys.exit(f"Clé API refusée (HTTP {e.code}). Vérifiez GEMINI_API_KEY dans .env.\n{detail[:400]}")
        sys.exit(f"Erreur API (HTTP {e.code}) :\n{detail[:800]}")

    for cand in payload.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                mime = inline.get("mimeType") or inline.get("mime_type") or "image/png"
                return base64.b64decode(inline["data"]), mime
    feedback = payload.get("promptFeedback", {})
    sys.exit("Aucune image dans la réponse. "
             f"Retour du modèle : {json.dumps(feedback or payload, ensure_ascii=False)[:600]}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--ref", action="append", default=[], help="image de référence (répétable)")
    ap.add_argument("--out")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--count", type=int, default=1)
    args = ap.parse_args()

    key = load_env_key()
    if not key:
        sys.exit("Pas de clé API. Créez-en une gratuitement sur https://aistudio.google.com/apikey\n"
                 "puis ajoutez cette ligne dans le fichier .env à la racine du repo :\n"
                 "  GEMINI_API_KEY=votre_cle_ici")

    if len(args.ref) > 3:
        sys.exit("Maximum 3 images de référence.")

    for i in range(args.count):
        data, mime = generate(key, args.model, args.prompt, args.ref)
        ext = mimetypes.guess_extension(mime) or ".png"
        if args.out and args.count == 1:
            out = args.out
        else:
            stamp = time.strftime("%Y%m%d-%H%M%S")
            suffix = f"-{i+1}" if args.count > 1 else ""
            out = os.path.join(HERE, "outputs", f"img-{stamp}{suffix}{ext}")
        os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
        with open(out, "wb") as f:
            f.write(data)
        print(f"✅ Image enregistrée : {out}")


if __name__ == "__main__":
    main()
