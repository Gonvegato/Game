#!/bin/sh
# Monta game.js a partir de los archivos de src/, en orden alfabético, y le pone la versión (el número de commits de la rama).
cd "$(dirname "$0")" && V=$(git rev-list --count HEAD 2>/dev/null || echo 0) && cat src/*.js | sed "s/__GAME_V__/$V/" > game.js && node --check game.js && echo "game.js montado: $(wc -l < game.js) líneas · versión $V"
