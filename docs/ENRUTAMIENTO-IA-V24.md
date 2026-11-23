# Enrutamiento automático IA — servidor V2.4

## Contrato y privacidad

`cloudFallbackConsent: true` debe ser un booleano explícito de un cliente que ya haya obtenido el consentimiento correspondiente. Ausente, falso o texto no lo activan.

- Foto: Gemini → Groq; Cloudflare sólo con el nuevo consentimiento.
- Etiqueta nutricional: Gemini exclusivamente en clientes antiguos; Gemini → Groq → Cloudflare con consentimiento nuevo.
- Tablas `/workouts/weekly` y `/weekly-plan`: Groq exclusivamente en clientes antiguos; Groq → Gemini → Cloudflare con consentimiento nuevo.
- Ningún modelo local; secretos sólo en servidor. Cloudflare está desactivado hasta que se configura el Worker.
- Fotos/etiquetas en caché por cuenta y hash, incluyendo versión de rutas y consentimiento. No se guarda la foto cruda en la caché. Las tablas incluyen el consentimiento en su firma. El estado de saturación no cambia las claves de caché.

## Saturación y errores

Una llamada por candidato autorizado, máximo 75 segundos compartidos y 25 segundos por transporte (configurable a un límite inferior). Un 429 respeta Retry-After hasta 3600 segundos; errores de disponibilidad tienen cooldown de 15 segundos; configuración inválida, 60 segundos. No se insiste en proveedores durante su cooldown. 401/403/404, 429, 5xx, timeout o red permiten intentar otro candidato autorizado.

JSON malformado, respuesta truncada/bloqueada o validación de dominio incorrecta NO activan otra inferencia y NO se guardan como hechos. Persisten validadores de ingredientes, 25 micronutrientes, porciones/unidades y ejercicios del catálogo. Los fallos devuelven la reserva de cuota de la aplicación; esto no garantiza reembolso de consumo del proveedor.

## Respaldo Cloudflare Worker

Render necesita `VERA_CF_WORKER_URL` (origen HTTPS `*.workers.dev`, sin ruta, query, credenciales ni puerto) y `VERA_CF_WORKER_SECRET` (mínimo 32 caracteres). Worker usa el mismo valor en `VERA_SHARED_SECRET` y binding `AI`. No introducirlos en APK ni en archivos versionados.

Modelo acordado: `@cf/qwen/qwen3.8-27b`, sin el paso de aceptación de licencia Meta del candidato inicial descartado. Contrato: POST `/v1/food-photo` o `/v1/text`, Bearer secreto, `{system,user,json,maxTokens}` → `{text}`. Las tablas antiguas de especialistas necesitan `json:false`; el coordinador final y las tablas de ejercicios usan `json:true`.

La asignación gratuita publicada de Workers AI es 10.000 neuronas diarias; no es uso ilimitado ni una garantía de disponibilidad. No se activa facturación desde este código.

Fuentes primarias consultadas:
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/
- https://console.groq.com/docs/vision

## Verificación

Sin gasto real: `automatic-routing24.mjs`, `automatic-routing-http24.mjs`, `automatic-workouts-http24.mjs`, `photo-fallback24.mjs`, `photo-quota-http24.mjs`, `workouts-http24.mjs`, `products-label-http24.mjs`, `audit-ai.mjs` y `audit-ai-http.mjs`. HTTP y SQLite reales; transportes IA simulados. Incluyen permiso estricto, privacidad de caché, cooldown, conservación de macros/micros y validación de las tablas, reservas/reembolsos e historial autenticado. Activación/despliegue del Worker y verificación real de su cuenta corresponden al integrador.

## Refuerzo posterior de esquemas y fotos parciales

Todos los candidatos reciben el esquema semanal exacto en la instrucción de sistema, incluyendo enums de IDs y fechas; Gemini recibe además `responseJsonSchema` (documentación: https://ai.google.dev/gemini-api/docs/structured-output). Groq mantiene `json_schema` estricto; Worker recibe el esquema junto con JSON mode y el servidor vuelve a validar la tabla. La firma de caché semanal pasa a26.

El prompt foto v6 conserva ingredientes identificables si un untable es ambiguo, excluye el ingrediente desconocido de nutrientes/subtotal y pide aclaración. No distingue cacao/cacahuete/manteca sólo por color. Pruebas sintéticas comprueban transporte de esquema a Gemini y Worker, contrato real del Worker, validación/reembolso y preservación de ingredientes parciales/pregunta. Esto mejora instrucciones, no demuestra precisión universal en fotos reales.

## Validación dentro de la cadena semanal

La revisión de cada tabla se ejecuta antes de aceptar la respuesta de un proveedor mediante `validateCandidate`. Sólo en tablas, un error `WORKOUT_FORMAT` o JSON inválido puede pasar al siguiente proveedor autorizado, con una llamada máxima por proveedor, una reserva de cuota y un plazo compartido. No se cambia a otro proveedor ante bloqueo de seguridad o truncamiento. Una respuesta `needs_review` válida se conserva como tal, sin convertirla en entrenamientos. Nunca se guarda la propuesta rechazada ni se recortan sus días silenciosamente.

El contexto aporta un presupuesto explícito de días y un calendario orientativo; la validación sigue imponiendo el límite. Caché semanal firma27. Prueba `workouts-validation-failover24.mjs`: Groq200 propone4días para perfil3; Gemini produce3 válidos; se persiste sólo la segunda tabla y se consume una reserva. Incluye rechazo de ambos, reembolso, concurrencia y protección ante cambios de perfil.

El último Worker de fotos, etiquetas o tablas puede usar hasta 65 s del tiempo restante, dentro del plazo total75s, para dar margen al Worker cuyo límite es60s. No se amplía el presupuesto total ni el número de intentos.

## Respaldo real verificado y despliegue final

23/11/2026: Worker versión `dbe56779-8062-43f5-8984-55deb4aacaa4`, desplegada en `https://vera-ai-backup.vera-rendimiento-beta.workers.dev`.

- Fotos/etiquetas: Qwen3.8-27b, sin cambios.
- Texto: `@cf/mistralai/mistral-small-3.1-24b-instruct`, modelo vigente sin razonamiento. Los candidatos Llama3.1-8B-FP8 y Qwen3-30B estaban marcados obsoletos el20/11/2026 y no se seleccionaron.
- `/workouts/weekly` envía al Worker un contrato compacto: catálogo indexado y sesiones con tuplas, máx1600tokens. Conserva el contexto de seguridad y la petición. El servidor deriva las siete fechas y descansos, restaura IDs canónicos y aplica el mismo validador de dominio. No recorta sesiones inválidas ni transforma needs_review en ejercicios.
- Mistral usa `max_tokens` y `guided_json`; su respuesta puede tener `response` como objeto JSON o texto. Se normaliza exclusivamente esa respuesta conocida o choices explícitos, rechazando tool calls/refusal/truncamiento declarado. No hay garantía de indicador de truncamiento en el formato legado; JSON completo y validación de dominio siguen siendo obligatorios.
- Firma de caché semanal28.

Prueba real autorizada en `../v243-build/check-compact.mjs`: Groq/Gemini429 SIMULADOS para forzar el respaldo; Worker Cloudflare REAL. Evidencia sin secretos `../v243-validation/WORKER-COMPACTO.json`: HTTP200,7días,3sesiones, lunes Tren inferior según petición, repetición cachétrue,5452ms. Una prueba anterior con Qwen compacto falló por timeout60s; el cambio de modelo es lo que permitió la respuesta rápida. No se enviaron datos de una cuenta real ni se escribió en producciónDB.

Fuentes primarias: https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/ y https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/.

En la prueba adicional de Plato, el servidor envió una imagen pública de café con ambos servicios principales simulados como saturados. Cloudflare identificó el café, pidió confirmar leche y azúcar y la repetición llegó de caché. El ZIP de verificación incluye WORKER-FOTO.json.
