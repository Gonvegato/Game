#!/bin/sh
# Monta el juego listo para distribuir: dist/www (lo que va dentro del APK y lo que se descarga al actualizar),
# dist/kiteo-<v>.zip y dist/version.json. La versión del juego es el número de commits de la rama.
set -e
cd "$(dirname "$0")/.."
./build.sh >/dev/null
V=$(git rev-list --count HEAD)
rm -rf dist/www && mkdir -p dist/www/assets/audio
cp index.html dist/www/
sed "s/__GAME_V__/$V/" game.js > dist/www/game.js   # la versión va solo en la copia que se distribuye
for f in $(grep -o "assets/[a-z_]*\.png" game.js index.html | sed 's/^[^:]*://' | sort -u); do cp "$f" dist/www/assets/; done
cp assets/pc_*.png dist/www/assets/
cp assets/audio/*.mp3 dist/www/assets/audio/
echo "$V" > dist/www/version.txt
rm -f dist/kiteo-*.zip
(cd dist/www && zip -qr -X "../kiteo-$V.zip" .)
SHA=$(sha256sum "dist/kiteo-$V.zip" | cut -d' ' -f1)
APKV=$(grep -o 'static final int SHELL = [0-9]*' android/src/app/kiteo/sala/MainActivity.java | grep -o '[0-9]*$')
printf '{"v":%s,"zip":"kiteo-%s.zip","sha256":"%s","apk":{"v":%s,"file":"SalaDeKiteo-%s.apk"}}\n' "$V" "$V" "$SHA" "$APKV" "$APKV" > dist/version.json
echo "juego v$V · $(du -h "dist/kiteo-$V.zip" | cut -f1) · app v$APKV"
