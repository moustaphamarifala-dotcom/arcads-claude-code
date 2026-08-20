#!/usr/bin/env bash
# Récupère la bibliothèque de médias de référence du pack de skills Arcads
# (influenceurs IA, photos produit, planches de style) depuis le dépôt amont.
#
# Ces fichiers (~119 Mo) ne sont PAS versionnés ici : le dépôt amont les ignore
# lui aussi (`references/` dans son .gitignore) et ils alourdiraient inutilement
# ce dépôt. Ils sont téléchargés à la demande, en local, par ce script.
#
# Usage : ./scripts/fetch-arcads-references.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UPSTREAM="https://github.com/krusemediallc/arcads-claude-code.git"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Clonage partiel de $UPSTREAM (dossier references/ uniquement)…"
git clone --depth 1 --filter=blob:none --sparse "$UPSTREAM" "$TMP/upstream" >/dev/null
git -C "$TMP/upstream" sparse-checkout set references >/dev/null

if [[ ! -d "$TMP/upstream/references" ]]; then
  echo "Le dépôt amont ne contient plus de dossier references/ — rien à copier." >&2
  exit 1
fi

mkdir -p "$ROOT/references"
# -n : ne jamais écraser un fichier de référence déjà présent en local.
cp -Rn "$TMP/upstream/references/." "$ROOT/references/"

echo ""
echo "✓ Références installées dans $ROOT/references/ :"
for d in "$ROOT/references"/*/; do
  [[ -d "$d" ]] || continue
  printf '  %-14s %s fichier(s)\n' "$(basename "$d")" "$(find "$d" -type f ! -name '.gitkeep' | wc -l | tr -d ' ')"
done
echo ""
echo "Ces fichiers restent locaux (ignorés par git)."
