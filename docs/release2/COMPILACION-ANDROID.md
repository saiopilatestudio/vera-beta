# Compilar VERA 2.0 beta para Android

Esta fuente corresponde a la APK `app.vera.coach.visionbeta`, `versionCode=200`, `versionName=2.0 beta`. El proyecto distribuido es `beta-android/`. El directorio histórico Capacitor `android/` no es el origen de esta APK y tiene otro identificador.

## Requisitos

- Java 17 (JRE es suficiente para este compilador).
- Eclipse ECJ 3.38.0 (`ecj.jar`). SHA-256 usado en la entrega: `97c566b120009c203a2fc8b291f4a9adbc171cf1ccb70f06f6b4e1828c00ce8e`.
- Android SDK Platform 35 (`android.jar`) y Android Build Tools 35.0.0, para Windows o Linux según el sistema.
- Python 3.12. El compilador usa su biblioteca estándar.
- Para pruebas del servidor: Node 24 y `npm ci`.

Los SDK/JRE no se incluyen en el ZIP del código. El compilador no descarga modelos ni necesita pesos. La conversación habitual y transcripción se solicitan a Groq mediante el backend; visión, revisión avanzada y voz se solicitan a Gemini. La APK no contiene claves de ninguno de los proveedores ni modelos de IA locales. No hay reconocimiento ni síntesis de voz local. La lectura de audio generado en el servidor no es inferencia local.

## Preparar las rutas en PowerShell

Sustituir únicamente las rutas por las herramientas instaladas y ejecutar desde la raíz del código:

```powershell
$java = 'C:/herramientas/jre17/bin/java.exe'
$ecj = 'C:/herramientas/ecj-3.38.0.jar'
$androidJar = 'C:/Android/Sdk/platforms/android-35/android.jar'
$buildTools = 'C:/Android/Sdk/build-tools/35.0.0'
New-Item -ItemType Directory -Force -Path './build-work','./build-output' | Out-Null
```

La compilación usa explícitamente UTF-8 para las cadenas españolas y evita depender de la página de códigos de Windows.

## Pruebas previas

```powershell
npm ci
npm test
python tests/audit-android-cloud.py
python tests/audit-android-native.py --java $java --ecj $ecj --android-jar $androidJar --work-dir ./build-work
```

La prueba nativa compila todos los Java y ejecuta 17 casos de autorización del origen del micrófono. La prueba cloud revisa ausencia de artefactos locales y de motores nativos de voz. Ninguna de ellas sustituye a probar biometría, cámara, Health Connect y permisos en un Android real.

## Compilar sin firmar para inspección

```powershell
python beta-android/build.py --java $java --ecj $ecj --android-jar $androidJar --build-tools $buildTools --work-dir ./build-work --output ./build-output/VERA-2.0-beta-unsigned.apk --mode unsigned
```

Una APK sin firmar sirve para inspección técnica y no es la entrega instalable al usuario.

## Compilar y firmar con la clave V2

La clave privada entregada está fuera del código, en la carpeta privada de la segunda parte. Conservar una copia segura de esa carpeta y no subirla a GitHub ni a Render. La contraseña se suministra al proceso en `BETA_PASS`, nunca como argumento literal ni dentro del código. Configurar esa variable con el gestor de secretos o de forma interactiva sin guardar su valor en el historial.

La clave V2 usa alias `vera-beta`. Su certificado público SHA-256 es:

```text
c127aeb4c5fb1a6d53dad20d75d1587c261e10052e674dbaa3aa0831be9be337
```

Con `BETA_PASS` ya configurada y la ruta real del archivo privado:

```powershell
python beta-android/build.py --java $java --ecj $ecj --android-jar $androidJar --build-tools $buildTools --work-dir ./build-work --output ./build-output/VERA-2.0-beta.apk --mode signed --keystore 'C:/ruta-privada/VERA-V2-beta.p12' --key-alias vera-beta --expected-cert-sha256 c127aeb4c5fb1a6d53dad20d75d1587c261e10052e674dbaa3aa0831be9be337
Remove-Item Env:BETA_PASS
```

El compilador no genera claves nuevas ni acepta cualquier certificado: comprueba que el APK fue firmado por la huella explícitamente elegida. La clave V2 es nueva y no permite actualizar directamente las APK antiguas firmadas con otras claves. Antes de una instalación limpia, exportar y comprobar el respaldo del diario según el manual. No desinstalar sin ese respaldo.

## Qué verifica la entrega

La ejecución completa compila Java, ejecuta la prueba de origen, genera DEX y recursos, alinea, firma si procede y verifica:

- Package y versión esperados.
- Firma válida y certificado seleccionado.
- Alineación ZIP con `-P 16`.
- Integridad CRC y DEX presente.
- Coincidencia byte a byte de todos los assets frente a `www/`, sin assets antiguos sobrantes.
- Ausencia de pesos locales, WASM/OCR y archivos privados de firma en el APK.
- Ausencia de referencias al motor Android de voz en DEX.
- Fuentes sin modificaciones durante la compilación.

Junto al APK se escribe `.apk.build.json` con hashes, tamaño, certificado público, assets verificados y limitaciones de las pruebas. No contiene la contraseña ni la clave privada. Un fallo conserva un subdirectorio de intermediarios dentro de `--work-dir` para diagnóstico; una compilación correcta limpia únicamente su directorio temporal.

## GitHub Actions

El workflow `.github/workflows/android.yml` ejecuta tests y el mismo compilador portable. Para firmar, configurar los secretos `VERA_KEYSTORE_BASE64` y `VERA_KEYSTORE_PASSWORD`, y la variable pública `VERA_EXPECTED_CERT_SHA256` con la huella del certificado. Los secretos corresponden a la clave V2; los valores históricos de otras versiones no son intercambiables. Mantener el modo unsigned para revisión sin acceso a firma.

No restaurar `coach.gguf`, `food.onnx`, `vision.onnx`, Tesseract ni runtimes locales. Los antiguos scripts de restauración se retiraron de V2 deliberadamente. El verificador rechaza esos artefactos si reaparecen.
