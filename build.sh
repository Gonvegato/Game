#!/bin/sh
# Monta game.js a partir de los archivos de src/, en orden alfabético.
# La versión no se pone aquí: el game.js del repositorio dice «de desarrollo». La pone tools/make_bundle.sh en la copia que se distribuye.
cd "$(dirname "$0")" && cat src/*.js > game.js && node --check game.js && echo "game.js montado: $(wc -l < game.js) líneas"
