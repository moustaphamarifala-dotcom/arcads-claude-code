#!/bin/bash
cd "$(dirname "$0")" || exit 1
echo "=== Studio — demarrage ==="
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installe. Telechargez-le sur https://nodejs.org puis relancez."
  read -r -p "Appuyez sur Entree pour fermer." _
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Installation (une seule fois, patientez 1 a 2 minutes)..."
  npm install || { read -r -p "Echec de l'installation. Entree pour fermer." _; exit 1; }
fi
( sleep 5; (open http://localhost:3000 || xdg-open http://localhost:3000) >/dev/null 2>&1 ) &
echo "L'application demarre sur http://localhost:3000"
echo "Pour arreter : Ctrl+C ou fermez cette fenetre."
npm run dev
