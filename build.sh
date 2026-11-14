#!/bin/sh
# Monta game.js a partir de los archivos de src/, en orden alfabético.
cd "$(dirname "$0")" && cat src/*.js > game.js && node --check game.js && echo "game.js montado: $(wc -l < game.js) líneas"
