@echo off
title PROS E-Commerce - Serveur Local
color 0A
echo ============================================================
echo      DEMARRAGE DE LA PLATEFORME PROS EN LOCAL
echo ============================================================
echo.
cd /d "%~dp0"
echo Repertoire du projet : %CD%
echo.
echo Ouverture du navigateur et lancement de Vite...
start http://localhost:5173
npm run dev
pause
