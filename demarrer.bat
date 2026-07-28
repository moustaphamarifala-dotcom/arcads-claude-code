@echo off
cd /d "%~dp0"
echo === Studio - demarrage ===
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js n'est pas installe. Telechargez-le sur https://nodejs.org puis relancez.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installation ^(une seule fois, patientez 1 a 2 minutes^)...
  call npm install
  if errorlevel 1 ( echo Echec de l'installation. & pause & exit /b 1 )
)
start "" http://localhost:3000
echo L'application demarre sur http://localhost:3000
echo Pour arreter : Ctrl+C ou fermez cette fenetre.
call npm run dev
