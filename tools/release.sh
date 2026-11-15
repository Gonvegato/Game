#!/bin/sh
# Publica una versión nueva del juego para la app de Android: monta el paquete y lo sube, con el archivo de versión,
# a la carpeta pública de kDrive que la app consulta al abrirse. Las apps instaladas se actualizan solas.
# Solo funciona donde haya acceso a la API de kDrive (en estas sesiones lo pone el proxy). Uso: tools/release.sh [apk]
# Con «apk» sube además el APK de dist/ (hazlo solo si ha cambiado android/ y has subido SHELL en MainActivity.java).
set -e
cd "$(dirname "$0")/.."
tools/make_bundle.sh
DRIVE=4481105; DIR=1060
up() { curl -sS -m 600 -X POST "https://api.infomaniak.com/3/drive/$DRIVE/upload?directory_id=$DIR&file_name=$1&total_size=$(stat -c %s "dist/$1")&conflict=version" -H "Content-Type: application/octet-stream" --data-binary @"dist/$1" | grep -q '"result":"success"' && echo "subido $1" || { echo "FALLO al subir $1"; exit 1; }; }
V=$(cat dist/www/version.txt)
up "kiteo-$V.zip"
if [ "$1" = apk ]; then up "$(basename dist/SalaDeKiteo-*.apk)"; fi
up version.json        # el último: hasta que no cambia, las apps siguen con la versión anterior
echo "publicada la versión $V del juego"
