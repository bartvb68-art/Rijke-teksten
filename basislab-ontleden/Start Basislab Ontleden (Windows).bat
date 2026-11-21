@echo off
title Basislab Ontleden
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is nog niet geinstalleerd.
  echo  De downloadpagina wordt geopend. Kies de LTS-versie, installeer die
  echo  en dubbelklik daarna opnieuw op dit bestand.
  echo.
  start "" https://nodejs.org
  pause
  exit /b
)
node -e "process.exit(+process.versions.node.split('.')[0] < 22 ? 1 : 0)"
if errorlevel 1 (
  echo  Je Node.js-versie is te oud. Installeer de nieuwste LTS-versie via https://nodejs.org
  start "" https://nodejs.org
  pause
  exit /b
)
if not exist "data\basislab-ontleden.db" (
  echo  Eerste keer opstarten: de demoschool wordt klaargezet...
  node --no-warnings=ExperimentalWarning scripts\seed-demo.js
)
echo.
echo  Basislab Ontleden start. Laat dit venster open zolang je speelt.
echo  Sluit dit venster om te stoppen.
echo.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:3000"
node --no-warnings=ExperimentalWarning server.js
pause
