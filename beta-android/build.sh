#!/bin/sh
set -eu
cd "$(dirname "$0")"
: "${BUILDTOOLS:?Ruta a Android build-tools 35}" "${ANDROID_JAR:?Ruta al android.jar de API 35}" "${ECJ:?Ruta al compilador ecj.jar}"
mode=${1:-signed}
case "$mode" in
 signed) : "${BETA_KEYSTORE:?Clave de distribución V2 necesaria}" "${BETA_PASS:?Contraseña de firma necesaria}" "${VERA_EXPECTED_CERT_SHA256:?Huella SHA-256 del certificado elegido necesaria}";;
 unsigned) ;;
 *) echo "Modo válido: signed o unsigned" >&2; exit 2;;
esac
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT
mkdir -p "$out/classes" "$out/dex"
java -jar "$ECJ" -nowarn -encoding UTF-8 -source 1.8 -target 1.8 -classpath "$ANDROID_JAR" -d "$out/classes" *.java
mkdir -p "$out/test-classes"
java -jar "$ECJ" -nowarn -encoding UTF-8 -source 1.8 -target 1.8 -d "$out/test-classes" OriginPolicy.java ../tests/audit-android-origin.java
java -cp "$out/test-classes" app.vera.coach.visionbeta.AndroidOriginAudit
(cd "$out/classes" && zip -qr "$out/classes.jar" .)
"$BUILDTOOLS/d8" --lib "$ANDROID_JAR" --min-api 26 --output "$out/dex" "$out/classes.jar"
"$BUILDTOOLS/aapt2" compile --dir res -o "$out/res.zip"
"$BUILDTOOLS/aapt2" link "$out/res.zip" -o "$out/base.apk" --manifest AndroidManifest.xml -I "$ANDROID_JAR" -A ../www
(cd "$out/dex" && zip -q "$out/base.apk" classes.dex)
"$BUILDTOOLS/zipalign" -f -P 16 4 "$out/base.apk" "$out/aligned.apk"
case "$mode" in
 unsigned) apk="$out/aligned.apk"; dest=${APK_OUTPUT:-VERA-2.1-beta-sin-firmar.apk};;
 signed)
   apk="$out/signed.apk"; dest=${APK_OUTPUT:-VERA-2.1-beta.apk}
   "$BUILDTOOLS/apksigner" sign --ks "$BETA_KEYSTORE" --ks-pass env:BETA_PASS --out "$apk" "$out/aligned.apk";;
esac
python3 ../tests/verify_apk.py "$apk" ../www "$BUILDTOOLS" --mode "$mode" --expected-cert-sha256 "${VERA_EXPECTED_CERT_SHA256:-}"
cp "$apk" "$dest"
