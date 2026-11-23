#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is nog niet geinstalleerd. De downloadpagina wordt geopend."
  echo "Kies de LTS-versie, installeer die en dubbelklik daarna opnieuw op dit bestand."
  open https://nodejs.org 2>/dev/null || xdg-open https://nodejs.org 2>/dev/null
  read -r -p "Druk op Enter om te sluiten."
  exit 1
fi
if ! node -e "process.exit(+process.versions.node.split('.')[0] < 22 ? 1 : 0)"; then
  echo "Je Node.js-versie is te oud. Installeer de nieuwste LTS-versie via https://nodejs.org"
  open https://nodejs.org 2>/dev/null || xdg-open https://nodejs.org 2>/dev/null
  read -r -p "Druk op Enter om te sluiten."
  exit 1
fi
if [ ! -f data/basislab-doorstroom.db ]; then
  echo "Eerste keer opstarten: de demoschool wordt klaargezet..."
  node --no-warnings=ExperimentalWarning scripts/seed-demo.js
fi
echo
echo "Basislab Doorstroom start. Laat dit venster open zolang er geoefend wordt; sluit het om te stoppen."
echo
( sleep 2; open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null ) &
exec node --no-warnings=ExperimentalWarning server.js
