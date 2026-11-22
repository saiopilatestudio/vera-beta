# Control de nube y entrega V2

Revisión independiente local, 22/11/2026. No se accedió a Render, no se intentó eludir el bloqueo del navegador y no se leyeron las claves privadas de trabajo.

## Resultado del código y paquetes revisados

- Los destinos de inferencia del adaptador son únicamente `api.groq.com` y `generativelanguage.googleapis.com`. Las claves se leen de variables del servidor y se envían en encabezados. No hay sustitución automática de proveedor.
- La síntesis de Gemini usa `store:false`; esto no representa una garantía de retención cero del proveedor.
- Se escanearon `www/`, la APK compilada anterior al nuevo rediseño y el archivo de código anidado del ZIP 2 anterior: no se encontraron pesos GGUF/ONNX/TFLite/Safetensors, runtimes WASM, datos OCR, almacenes de firma privados ni patrones de credenciales Groq/Google. El análisis de patrones no sustituye una garantía absoluta de ausencia de secretos.
- La conexión Turso está en `storage.mjs`, mediante `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` privados. En Render, la ausencia de URL causa error para evitar utilizar SQLite efímero. Fuera de producción existe SQLite para desarrollo y pruebas: almacenar datos localmente no es inferencia de IA.
- El resumen de validación existente registra 13 órdenes con código de salida 0. Corresponde a la edición previa al rediseño actual, no certifica los assets nuevos.
- README y CONFIGURACION-SERVIDOR distinguen compilación de despliegue y no afirman que producción esté actualizada.

## Bloqueo material pendiente

No hay evidencia accesible en esta revisión de que Render ejecute V2, de que las claves estén configuradas allí ni de que Turso responda con sus credenciales reales. La autorización escrita del usuario no elimina el permiso técnico guardado que bloquea el acceso al panel. Por tanto, no presentar esta entrega como servidor activado ni como aplicación completamente lista para IA en producción.

El propietario debe desbloquear el acceso técnico al panel o configurar el servicio manualmente. Conservar la base actual y sus credenciales; no crear otra base para sortear el bloqueo. No incluir claves de IA/Turso en la APK ni en el ZIP público de código.

## Cierre requerido tras el rediseño

Recompilar y firmar la APK después del freeze de CSS, ejecutar las verificaciones relevantes, regenerar el manual y ambos ZIP y cotejar los assets del binario con la fuente. Actualizar tamaño, SHA-256 y alcance de la evidencia. Las pruebas reales de cámara, audio, biometría, Health Connect y proveedores siguen siendo distintas de las pruebas con transporte simulado.

## Evidencia posterior del coordinador

PROVEEDORES-REALES.json registra llamadas directas con datos sintéticos: chat Groq correcto, TTS Gemini correcto y coach avanzado Gemini429. Esto no verifica Render/Turso ni implica que las claves estén instaladas en producción.
