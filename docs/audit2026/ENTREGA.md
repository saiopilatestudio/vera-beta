# Entrega auditada de VERA — 22/11/2026

## Alcance y procedencia

La petición actual fue investigar web y app, localizar fallos/mejoras y avanzar en correcciones. Los prompts adjuntos se trataron como contexto histórico, no órdenes de desplegar, cobrar, contactar terceros o borrar datos.

Los ZIP originales permanecen intactos. GitHub main: e5e3cc4fd45df2d70b361254852259d235ae9a24. Coinciden 163 de 166 blobs remotos con la fuente del ZIP; diferencias: .gitattributes ausente, gradlew.bat y owner.json ausente. Todos los recursos www aportados coinciden con la APK original. No se publicó commit, PR, despliegue ni APK.

## Cambios principales

- Diario transaccional, calendario real, rangos/revisiones; errores de auth/nick/cuota diferenciados; índices aditivos.
- Credenciales administrativas heredadas desactivadas, validación de roles y datos, exclusión de secretos en Git.
- Adaptador Groq explícito para texto, visión y Whisper. URLs fijas, sin fallback, sin claves cliente. Configuración separada de verificación real.
- DTO de IA, ingredientes/transcripción validados; contexto acotado/saneado y lectura del diario autenticado. Una petición simultánea por cuenta, 20 globales por proceso, deadline de 65 segundos para coordinador/especialistas. 429 conserva Retry-After; no se repiten automáticamente solicitudes potencialmente facturables.
- Recuperación de JSON corrupto, aviso de almacenamiento lleno/guardado local; consentimiento por cuenta, protección de respuestas tardías, logout biométrico, sueño opcional, macros desconocidos como null y aceptación explícita de planes.
- Contexto cliente de hasta 90 KB UTF-8 y 120 registros recientes, con cobertura visible.
- Android: origen exacto de micrófono, restricción de frames, cancelación permisos/selector, liberación de WebView, paginación Health Connect y micrófono opcional.
- CI con pruebas Node antes de compilar; pruebas históricas aisladas de variables de producción.

## Evidencia

Cuatro suites históricas y **67 grupos nuevos**: backend 15, acceso heredado 3, adaptador IA 13, HTTP 11, HTTP con proveedor simulado 9 y frontend 16. Además, 17 casos JVM de origen, compilación Java API35 y recursos Android. Son grupos, no un porcentaje de cobertura. Cinco defectos se reprodujeron en el original antes de comprobar la corrección.

`npm test` ejecuta las suites portables. `tests/audit-backend-baseline.mjs` necesita la carpeta original exterior y no pertenece al CI portable. `tests/audit-frontend.mjs` es una suite Playwright preparada pero NO ejecutada: lanzamiento EPERM y posterior rechazo del origen local por la herramienta de navegador. Los 16 grupos frontend usan VM/DOM mínimo; no equivalen a QA visual ni accesibilidad completa.

SQLite y HTTP son reales con usuarios sintéticos. Las respuestas de proveedor están simuladas: no prueban inferencia, visión, Whisper, coste ni cuotas de Groq real. Turso remoto no se probó. El análisis de dependencias fijadas informó 0 advisories conocidos; no garantiza seguridad integral.

APK original SHA256: 3788f5c015cf49914e26ca26eaa8d227652e5819316cf26473bb195fa28d5d30. Firma v2/v3 y alineación verificadas. Certificado 1.0.3: e816105533d0800d388a44f802a6b90a74573242eec531ee69eaa73a4a826d71. Certificado 1.0.2: 54fc449c3399b2facb0f556024361e2d02653c938196bc046a9b71b1bb228786. No se ha generado APK nueva ni localizado clave privada validada para una actualización compatible.

## Antes de desplegar

1. Revisar diff y pruebas en una rama; exportar Turso y ensayar restauración en staging. Los cambios de esquema son índices aditivos.
2. Configurar contraseña administrativa nueva, retirar owner.json rastreado y rotar credenciales. No reactivar el archivo heredado. Planificar limpieza histórica sin sobrescribir trabajo ajeno.
3. Probar dos cuentas/dispositivos, desconexión, conflicto y almacenamiento lleno. No desinstalar apps con datos sin restauración comprobada.
4. Si se selecciona Groq, configurar clave sólo en backend, verificar modelos disponibles en esa cuenta y probar chat/foto/voz/429/timeout/consentimiento con datos sintéticos. Revisar condiciones y retención antes de enviar datos personales.
5. Verificar las 12 áreas visualmente y rutas nativas. Ensayar actualización con certificado compatible y versionCode superior antes de publicar.

El ZIP no modifica Render ni GitHub. La vuelta atrás de código no borra datos; restaurar base es un procedimiento separado.

## Pendiente

Groq exclusivo y retirada de pesos; memoria/chat/perfil centralizados; function calling de escritura; Code Interpreter; score reproducible; catálogo bilingüe por ID; composición DSLD; micronutrientes con fuente; sesiones/rutinas versionadas; grupos de más de dos; amigos/bloqueos; recuperación de contraseña; exportación/eliminación integral; retención; rate limits distribuidos/proxy de confianza; observabilidad de tokens/costes; QA visual/nativo.

No se activaron pagos, publicidad, venta de datos ni prospección automática. No se sustituyó Node/libSQL por FastAPI/PostgreSQL.
