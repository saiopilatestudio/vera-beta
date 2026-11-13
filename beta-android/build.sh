#!/bin/sh
set -eu
cd "$(dirname "$0")"
: "${BUILDTOOLS:?Ruta a Android build-tools 35}" "${ANDROID_JAR:?Ruta al android.jar de API 35}" "${ECJ:?Ruta al compilador ecj.jar}" "${BETA_KEYSTORE:?Almacén de firma}" "${BETA_PASS:?Contraseña de la firma}"
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT
mkdir -p "$out/classes" "$out/dex"
java -jar "$ECJ" -nowarn -source 1.8 -target 1.8 -classpath "$ANDROID_JAR" -d "$out/classes" *.java
(cd "$out/classes" && zip -qr "$out/classes.jar" .)
"$BUILDTOOLS/d8" --lib "$ANDROID_JAR" --min-api 26 --output "$out/dex" "$out/classes.jar"
"$BUILDTOOLS/aapt2" compile --dir res -o "$out/res.zip"
"$BUILDTOOLS/aapt2" link "$out/res.zip" -o "$out/base.apk" --manifest AndroidManifest.xml -I "$ANDROID_JAR" -A ../www
(cd "$out/dex" && zip -q "$out/base.apk" classes.dex)
"$BUILDTOOLS/zipalign" -f 4 "$out/base.apk" "$out/aligned.apk"
"$BUILDTOOLS/apksigner" sign --ks "$BETA_KEYSTORE" --ks-pass env:BETA_PASS --out "${APK_OUTPUT:-Vera-beta.apk}" "$out/aligned.apk"
"$BUILDTOOLS/apksigner" verify --verbose "${APK_OUTPUT:-Vera-beta.apk}"
