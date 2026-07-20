#!/usr/bin/env python3
"""Free Studio — fabrique un lien Pollinations (génération d'image gratuite, sans compte).

Usage :
  python3 make_image_link.py --prompt "photo publicitaire de ..." [--format carre|portrait|paysage|story]

Ouvre le lien affiché dans n'importe quel navigateur (téléphone ou PC) :
l'image se génère gratuitement, sans clé ni inscription.
"""

import argparse
import urllib.parse

FORMATS = {
    "carre": (1024, 1024),      # post Meta/Instagram carré
    "portrait": (1024, 1280),   # feed 4:5
    "story": (1080, 1920),      # story/reel 9:16
    "paysage": (1280, 720),     # YouTube/bannière 16:9
}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--format", choices=FORMATS, default="portrait")
    args = ap.parse_args()

    w, h = FORMATS[args.format]
    url = ("https://image.pollinations.ai/prompt/"
           + urllib.parse.quote(args.prompt)
           + f"?width={w}&height={h}&nologo=true&enhance=true")
    print(url)


if __name__ == "__main__":
    main()
