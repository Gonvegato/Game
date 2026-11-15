#!/bin/sh
# Monta el APK a mano, sin Gradle: recursos (aapt2), código (javac + d8), el juego dentro (assets/www), alineado y firmado.
# Necesita: ANDROID_SDK_ROOT con build-tools 34.0.0 y platforms/android-34, y la clave de firma en KITEO_KS (con KITEO_KS_PASS).
# La clave NO está en el repositorio: sin la misma clave, Android no deja instalar una app nueva encima de la anterior.
set -e
cd "$(dirname "$0")"
SDK=${ANDROID_SDK_ROOT:-/root/android-sdk}; BT=$SDK/build-tools/34.0.0; JAR=$SDK/platforms/android-34/android.jar
: "${KITEO_KS:?falta KITEO_KS (ruta al almacén de claves)}" "${KITEO_KS_PASS:?falta KITEO_KS_PASS}"
../tools/make_bundle.sh
SHELL_V=$(grep -o 'static final int SHELL = [0-9]*' src/app/kiteo/sala/MainActivity.java | grep -o '[0-9]*$')
sed -i "s/android:versionCode=\"[0-9]*\" android:versionName=\"[^\"]*\"/android:versionCode=\"$SHELL_V\" android:versionName=\"1.$SHELL_V.0\"/" AndroidManifest.xml
rm -rf build && mkdir -p build/res build/classes build/dex build/apk/assets
"$BT/aapt2" compile --dir res -o build/res/res.zip
"$BT/aapt2" link -o build/base.apk -I "$JAR" --manifest AndroidManifest.xml build/res/res.zip --auto-add-overlay
javac -nowarn --release 11 -cp "$JAR" -d build/classes $(find src -name '*.java') 2>&1 | grep -v "^Note:\|warning: \[options\]\|^Picked up\|^[0-9]* warning" || true
(cd build/classes && jar cf ../classes.jar .)
"$BT/d8" --min-api 24 --lib "$JAR" --output build/dex build/classes.jar
cp -r ../dist/www build/apk/assets/www
cp build/base.apk build/unsigned.apk
(cd build/dex && zip -q ../unsigned.apk classes.dex)
(cd build/apk && zip -qr -0 ../unsigned.apk assets)        # sin comprimir: son png y mp3, y así abre antes
"$BT/zipalign" -f 4 build/unsigned.apk build/aligned.apk
"$BT/apksigner" sign --ks "$KITEO_KS" --ks-pass "pass:$KITEO_KS_PASS" --out "../dist/SalaDeKiteo-$SHELL_V.apk" build/aligned.apk
"$BT/apksigner" verify "../dist/SalaDeKiteo-$SHELL_V.apk" && echo "APK: dist/SalaDeKiteo-$SHELL_V.apk · $(du -h "../dist/SalaDeKiteo-$SHELL_V.apk" | cut -f1)"
