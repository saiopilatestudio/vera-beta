# Control de nube y entrega V2

Revisión independiente inicial y cierre posterior del coordinador, 22/11/2026. La auditoría inicial fue local; el cierre que aparece al final incorpora el despliegue y la verificación pública posteriores.

## Resultado del código y paquetes revisados

- Los destinos de inferencia del adaptador son únicamente `api.groq.com` y `generativelanguage.googleapis.com`. Las claves se leen de variables del servidor y se envían en encabezados. No hay sustitución automática de proveedor.
- La síntesis de Gemini usa `store:false`; esto no representa una garantía de retención cero del proveedor.
- Se escanearon `www/`, la APK compilada anterior al nuevo rediseño y el archivo de código anidado del ZIP 2 anterior: no se encontraron pesos GGUF/ONNX/TFLite/Safetensors, runtimes WASM, datos OCR, almacenes de firma privados ni patrones de credenciales Groq/Google. El análisis de patrones no sustituye una garantía absoluta de ausencia de secretos.
- La conexión Turso está en `storage.mjs`, mediante `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` privados. En Render, la ausencia de URL causa error para evitar utilizar SQLite efímero. Fuera de producción existe SQLite para desarrollo y pruebas: almacenar datos localmente no es inferencia de IA.
- El resumen de validación existente registra 13 órdenes con código de salida 0. Corresponde a la edición previa al rediseño actual, no certifica los assets nuevos.
- README y CONFIGURACION-SERVIDOR distinguen compilación de despliegue y no afirman que producción esté actualizada.

## Estado inicial y resolución

La revisión inicial no tenía acceso al panel de Render y no podía acreditar producción. Ese bloqueo quedó resuelto posteriormente: se accedió con la sesión autorizada del propietario, se publicaron los cambios y se verificó el despliegue V2. Las credenciales existentes de Turso se conservaron; no se creó otra base ni se incluyeron claves en APK/código.

## Cierre realizado tras el rediseño

La APK se recompiló y firmó después del rediseño CSS. Se comprobaron los 19 assets byte a byte contra la fuente, firma v2/v3, versión, CRC y alineación. El manual y los ZIP se regeneraron; el tamaño de la APK es 378517 bytes y su SHA-256 es 93932b8ff63c8d3f0116ac15c8f88baeb11744f29578f170d91cfd16008dcd8d. Las pruebas reales de cámara, audio, biometría, Health Connect y proveedores siguen siendo distintas de las pruebas con transporte simulado.

## Evidencia posterior del coordinador

PROVEEDORES-REALES.json registra llamadas directas con datos sintéticos: chat Groq correcto, TTS Gemini correcto y coach avanzado Gemini429. Esto no verifica Render/Turso ni implica que las claves estén instaladas en producción.

## Producción verificada

Render confirmó `Deploy succeeded` y `Your service is live` el 22/11/2026 a las 02:18:58 (Europe/Paris), despliegue `dep-dc145p1ksfps73fpcqgg`, commit `7b35db3c4991d845802da07dab1f4567d9cc70f6`. Se utilizó Node 24.22.3, `npm ci --omit=dev` y `npm run start` (`node server.mjs`), con comprobación de salud `/health`. Las variables Groq, Gemini y Turso permanecen privadas en Render.

A las 02:19:24 (Europe/Paris), `/health` respondió HTTP 200 `ok` y `/capabilities` HTTP 200, `apiVersion: 2.0`, `execution: cloud-only`, `localInference: false`, `speechOutput: remote`, sólo Groq/Gemini y ocho rutas configuradas. Evidencia: `PRODUCCION-V2.json` en el ZIP 2. El arranque espera la inicialización de la base configurada; no se consultaron datos de usuarios ni se crearon cuentas para esta comprobación.

Estos resultados verifican despliegue, arranque y configuración. No prueban inferencia de cada ruta a través de Render ni uso integrado de la APK en un teléfono. Se mantiene documentado el 429 de la prueba directa de revisión avanzada Gemini.
