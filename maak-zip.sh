#!/bin/sh
# Maakt dist/basislab-meestertekst-server.zip om naar de VPS te uploaden.
set -e
cd "$(dirname "$0")"
mkdir -p dist
rm -f dist/basislab-meestertekst-server.zip
zip -qr dist/basislab-meestertekst-server.zip Dockerfile .dockerignore package.json package-lock.json tsconfig.json server public deploy/naast-typen.yml deploy/.env.example README.md
echo "Klaar: dist/basislab-meestertekst-server.zip"
