# Auditoría Android y procedencia de VERA — 22 de noviembre de 2026

## Conclusión verificable

La APK aportada sí corresponde a los recursos web de los ZIP: todos los archivos presentes en `github/www` coinciden byte a byte con los assets de la APK reconstruida. La aplicación publicada en esos archivos procede de **beta-android**, no del proyecto Capacitor `android/`.

La APK original tiene 693.377.886 bytes (661,26 MiB). Los tres modelos `coach.gguf`, `food.onnx` y `vision.onnx` suman 673.814.533 bytes: aproximadamente el 97,18 % del tamaño completo. El tamaño y la obligación de restaurar estos modelos son incompatibles con la descripción documental de un cliente ligero cuya IA generativa vive exclusivamente en Groq; esta auditoría no elimina funcionalidades locales sin completar primero esa migración.

Además de la divergencia arquitectónica, existe una causa concreta del fallo histórico de actualización: la APK 1.0.2 relacionada que estaba en Descargas y la 1.0.3 aportada tienen el mismo identificador de aplicación y certificados de firma distintos.

## Identidad y firma comprobadas

| Propiedad | APK 1.0.3 aportada | APK 1.0.2 relacionada en Descargas |
|---|---|---|
| Package | app.vera.coach.visionbeta | app.vera.coach.visionbeta |
| versionCode | 13 | 12 |
| versionName | 1.0.3 beta | 1.0.2 beta |
| min SDK / target SDK | 26 / 35 | 26 / 35 |
| Certificado SHA-256 | e816105533d0800d388a44f802a6b90a74573242eec531ee69eaa73a4a826d71 | 54fc449c3399b2facb0f556024361e2d02653c938196bc046a9b71b1bb228786 |

SHA-256 de la APK 1.0.3 reconstruida: `3788f5c015cf49914e26ca26eaa8d227652e5819316cf26473bb195fa28d5d30`. Coincide con el valor del script de reconstrucción entregado.

`apksigner verify --verbose --print-certs` verificó la APK 1.0.3 con esquemas v2 y v3 y un firmante. La ausencia de verificación v1 en esa salida no se presenta como defecto: el minSdk es 26 y se verifican los esquemas aplicables. `zipalign -c -P 16 4` terminó correctamente. El manifiesto binario fue comprobado con `aapt2 dump badging`, además de la extracción de metadatos independiente.

No se ha localizado ni generado una clave privada de distribución. No se ha firmado una nueva APK, desinstalado una app, accedido a registros de usuarios ni tocado producción. El certificado público no permite recuperar una clave privada. Una futura versión debe conservar package y firma compatible con la versión realmente instalada, incrementar versionCode y probar actualización con datos. Los archivos aportados no demuestran que la 1.0.3 pueda actualizar la 1.0.2 sin una cadena de rotación de firma válida; la simple subida de versionCode no lo soluciona.

El proyecto Capacitor, en cambio, declara `app.vera.coach`, versionCode 1/versionName 1.0. Compilarlo no produce una actualización de la APK beta. No se ha cambiado ese identificador para ocultar la divergencia.

## Hallazgos y correcciones

Las referencias de línea siguientes corresponden al código original `work/original/github`.

| ID | Prioridad | Evidencia y efecto | Estado |
|---|---|---|---|
| AND-01 | P1 seguridad | `beta-android/Main.java:31` autoriza micrófono mediante `startsWith("https://localhost")`: también coincide con `https://localhost.evil.example` o un puerto ajeno. Existe un control de navegación, por lo que no se afirma explotación remota demostrada; el control de autorización por sí mismo era incorrecto. | Corregido: política exacta de esquema, host, puerto y ausencia de credenciales/query/fragmento; 17 casos ejecutados sobre la política real. |
| AND-02 | P1 seguridad | El puente `addJavascriptInterface` se expone a todos los frames. El HTML local no contenía una política que impidiera cargar frames ajenos. | Mitigado: CSP en respuestas HTML locales que bloquea frames, objetos, cambio de base y envío de formularios. Se preservan scripts y conexiones existentes. No sustituye a corregir XSS en frontend. |
| AND-03 | P1 robustez | `Main.java:31` conserva una solicitud de micrófono cancelada y sobrescribe otra si llegan peticiones mientras se muestra el permiso Android. Podía resolver una solicitud obsoleta o dejar otra sin respuesta. | Corregido: cancelación, rechazo de solicitud concurrente y limpieza en destrucción. Compilado; prueba en dispositivo pendiente. |
| AND-04 | P1 robustez | `Main.java:30` abre el selector sin capturar la ausencia de actividad o denegación de seguridad. Tras fallar la cámara también podía caer al selector y terminar la Activity con excepción. | Corregido: captura de ambas excepciones, callback terminado con null y mensaje útil. Compilado; simulación de selector ausente en dispositivo pendiente. |
| AND-05 | P1 integridad | `HealthReader.java:21` pide 500 registros y nunca consulta `getNextPageToken()`: trunca silenciosamente lecturas de más de una página. | Corregido: paginación, límite explícito de 20 páginas y error sin emitir un resultado parcial del tipo solicitado. Respeta destrucción de Activity y revocación de permisos durante las lecturas paginadas. Compilado contra API 35; prueba con Health Connect real pendiente. |
| AND-06 | P2 recursos | `Main.java:73` únicamente cerraba TTS; callbacks de fichero, permiso y WebView seguían sin liberar. Los callbacks de salud podían intentar usar una Activity destruida. | Corregido: limpieza de callbacks/puente/WebView, retirada del padre antes de destruirlo y guardas en emisiones/estado. |
| AND-07 | P2 compatibilidad | El permiso RECORD_AUDIO hacía que Android infiriese hardware de micrófono obligatorio, aunque existen entrada de texto y registro manual. Confirmado por aapt2. | Corregido en ambos manifiestos: `uses-feature microphone required=false`. Aapt2 confirma `uses-feature-not-required`. |
| AND-08 | P1 entrega | Dos proyectos Android con package/versiones distintos. El workflow compila beta-android, mientras package.json ofrece sincronización Capacitor. | Documentado; pendiente consolidación planificada con prueba de migración. No se alteraron package ni firma. |
| AND-09 | P1 entrega | 1.0.2 y 1.0.3 tienen distinto certificado. | Causa verificada. Requiere recuperar la clave compatible, estrategia de rotación válida o migración explícita de datos; no solucionable cambiando solo versión. |
| AND-10 | P2 tamaño/arquitectura | Workflow restaura tres modelos; build.sh exige sus hashes. APK ~693 MB. | Documentado. Retirar pesos y runtimes debe acompañar una sustitución completa y probada de los flujos que los usan. |
| AND-11 | P2 CI | Workflow compilaba APK sin ejecutar los tests Node y con permisos de token implícitos. | Mejorado: job previo `npm ci`/`npm test` en Node 24, `contents: read`, checkout sin persistir credenciales, timeouts y limpieza de copia temporal de la clave. Las pruebas de origen también se ejecutan en build.sh. No se ha lanzado GitHub Actions real. |

## Comprobaciones realizadas

1. Reconstrucción de APK mediante concatenación de los streams de los ZIP, sin ejecutar su CMD.
2. SHA-256 completa y comparación de todos los recursos web suministrados contra APK: sin discrepancias.
3. Inspección del manifiesto, certificado, entradas ZIP y ausencia de bibliotecas `.so`.
4. Verificación criptográfica con apksigner oficial 35.0.0: PASS v2/v3.
5. Alineación con zipalign oficial 35.0.0, opción `-P 16`: PASS.
6. Compilación de todos los Java modificados de beta-android con ECJ 3.38.0, JRE Temurin 17 y `android.jar` API 35: PASS.
7. Ejecución real en JVM de `OriginPolicy` usada por Main: PASS 17 casos, incluyendo dominios por prefijo, userinfo, puertos, fragmentos y esquemas incorrectos.
8. Compilación de recursos y manifiesto con aapt2: PASS. Hardware micrófono opcional confirmado en el resultado binario.
9. Verificación de la APK histórica 1.0.2 existente en Descargas: firma y package obtenidos con herramientas oficiales.

No se ha probado biometría, cámara, Health Connect, funcionamiento en segundo plano, instalación, actualización ni consumo de RAM en un Android físico/emulado. Una prueba de Chromium de assets no constituye una prueba de esos servicios nativos. No se entrega una APK nueva instalable.

Los binarios de herramientas se descargaron por HTTPS y sus sumas coincidieron con los metadatos oficiales: JRE SHA-256 `739d8f2fd286dc2736d55cc8c9260980baefd275ad48cda242335bb0f08e0795`, ECJ SHA-256 `97c566b120009c203a2fc8b291f4a9adbc171cf1ccb70f06f6b4e1828c00ce8e`, plataforma SHA-1 `0bb560a90a7a2cbd0dd8348224d518b638fe7949`, build-tools SHA-1 `af059bb67cf7786f45ee0db85e2d24985df1b4b6`. Las sumas SHA-1 son las publicadas por el repositorio SDK; no se han utilizado como sustituto de TLS.

## Reproducción

Ejecutar, desde la raíz del código:

```text
python tests/audit-android-native.py --java RUTA/java.exe --ecj RUTA/ecj.jar --android-jar RUTA/android.jar --work-dir RUTA_ESCRIBIBLE
```

La prueba compila el código de producción contra SDK, ejecuta los casos de origen y borra únicamente su directorio temporal creado dentro de la ruta indicada. `beta-android/build.sh` también ejecuta la prueba de origen antes de generar APK. El build completo sigue requiriendo los modelos originales y, en modo signed, la clave compatible; esta auditoría no relaja las comprobaciones existentes de firma/modelos.

Evidencias compactas en `work/android-audit/evidence`: informe JSON de assets/tamaño, manifiesto original JSON, clases Java compiladas, log de validación y ZIP de recursos/manifiesto compilados. **El ZIP de recursos es evidencia de compilación, no una aplicación instalable**. No incluir herramientas JRE/SDK, modelos ni APK original en la entrega compacta.

## Investigación oficial y siguientes mejoras Android

- [Puentes nativos WebView](https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges): addJavascriptInterface alcanza todos los frames. A medio plazo conviene pasar a WebMessageListener con reglas explícitas de origen y separar las capacidades nativas. La CSP añadida reduce superficie; los fallos XSS del origen autorizado siguen necesitando corrección.
- [Inclusión de archivos en WebView](https://developer.android.com/privacy-and-security/risks/webview-unsafe-file-inclusion): se han explicitado restricciones de acceso desde file URLs y contenido mixto. Mantener content access es necesario para fotos seleccionadas; no se ha bloqueado a ciegas.
- [Firma de aplicaciones](https://developer.android.com/studio/publish/app-signing): custodiar la clave de distribución y comprobar certificado y package antes de publicar. Diseñar un ensayo de actualización conservando diario/cuenta antes de entregar a usuarios.
- [Paginación Health Connect](https://developer.android.com/reference/android/health/connect/ReadRecordsResponse#getNextPageToken()): el token -1 identifica fin de resultados. El lector original no lo atendía.
- [Tamaños de página de 16 KB](https://developer.android.com/guide/practices/page-sizes): el APK inspeccionado no incluye ELF .so; no hay evidencia de un fallo de alineación nativa. WASM no debe confundirse con una biblioteca ELF. Hace falta ensayo en dispositivo de 16 KB y repetir comprobación si se añaden SDK nativos.
- [Migración Capacitor 8](https://capacitorjs.com/docs/updating/8-0): la guía marca SDK 36/AGP 8.13/Gradle 8.14.3 para ese proyecto. El árbol Capacitor ya declara esos componentes, pero no es el artefacto distribuido. El target 35 de beta-android debe revisarse según canal de distribución antes de publicación; no se ha cambiado sin probar sus cambios de comportamiento.

Orden recomendado: proteger firma e integridad de datos; prueba real de actualización; consolidar un único proyecto Android; automatizar una matriz Android 8/9/14/15/16 y 16 KB; comprobar permisos denegados/revocados y proceso muerto; completar migración Groq y entonces retirar modelos; medir arranque, memoria, batería y accesibilidad con TalkBack.
