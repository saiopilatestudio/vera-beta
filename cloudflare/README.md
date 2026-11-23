# VERA: un Worker de respaldo para texto y fotografías

Un único Worker ofrece dos rutas limitadas con el mismo binding AI. Evita duplicar secretos, configuración y despliegues; no sirve la web ni almacena registros de usuarios. Render mantiene autenticación de usuarios, cuotas por cuenta, caché y validación nutricional/de entrenamientos. El móvil nunca recibe el secreto del Worker.

## Contrato

- POST HTTPS `/v1/food-photo`: fotos de comida o etiquetas, exactamente una imagen JPEG/PNG/WebP embebida como data URL y un texto opcional. `json:true` obligatorio.
- POST HTTPS `/v1/text`: informes semanales/coordinación, `user` string; admite `json:true` o `false`.
- Cabecera `Authorization: Bearer <secreto compartido>` y `Content-Type: application/json`. No acepta `Origin` de navegadores, query strings, URLs de imágenes externas, herramientas ni rutas arbitrarias.
- Body: `{system,user,json,maxTokens}`. `maxTokens` entero1–5000; system hasta16000caracteres, usertexto hasta64000, textoimagen hasta8000. Body máximo12MB y base64imagen hasta11millones de caracteres (~8MB). Sólo estos cuatro campos.
- Éxito: `{text:string}`. Respuesta completa (`finish_reason:stop`) y sin rechazo. JSON solicitado debe ser objeto. El servidor Render valida después el esquema de dominio; este Worker no convierte una respuesta inválida en válida.
- Errores: 401 autenticación, 400/413 entrada, 422 `AI_INCOMPLETE`, 429 `AI_RATE_LIMIT` con `Retry-After:60`, 503 configuración/saturación y 504 timeout. Los errores privados de Cloudflare nunca se devuelven al cliente.
- El plazo es60segundos, sin reintentos internos. Un timeout HTTP no garantiza cancelar una inferencia ya iniciada en el binding. El router debe conservar su presupuesto total y no repetir la misma llamada indiscriminadamente.

## Despliegue para el responsable de la cuenta

Procedimiento para volver a publicar este servicio en una cuenta de Cloudflare.

1. Mantener la cuenta en Workers Free si se exige evitar gastos; no activar facturación. Confirmar disponibilidad de Workers AI en la cuenta.
2. Instalar/usar Wrangler oficial y autenticar la cuenta mediante `npx wrangler login`.
3. Desde esta carpeta: `npx wrangler deploy --config wrangler.jsonc`. Se publicará `vera-ai-backup` con binding `AI`; hasta guardar el secreto todas las inferencias se rechazan.
4. Crear un secreto aleatorio de al menos32caracteres en un gestor seguro. Guardarlo con `npx wrangler secret put VERA_SHARED_SECRET --config wrangler.jsonc`, introduciéndolo únicamente en el prompt privado. No añadirlo al repositorio, capturas, manual público ni APK.
5. En Render guardar `VERA_CF_WORKER_URL=https://vera-ai-backup.<subdominio>.workers.dev`, `VERA_CF_WORKER_SECRET` con el mismo secreto. El Worker ignora modelos enviados por el llamante: su modelo es fijo en código.
6. Probar primero401 sin secreto y después una llamada sintética autenticada de texto/imagen desde el servidor. Verificar que el binding devuelve `choices` con `finish_reason:stop`. No afirmar disponibilidad real hasta superar esta prueba de cuenta.
7. Activar la ruta de respaldo en Render, manteniendo sus cuotas/cache y comprobación de resultados. No registrar cabeceras, prompts, fotos, respuestas ni datos de salud. La configuración desactiva observabilidad del Worker y el código no escribe logs ni KV/D1.

Pruebas locales sin Cloudflare: desde la raíz `node tests/cloudflare-worker24.mjs`. Cubren autenticación, HTTPS, aislamiento servidor, forma/tamaño, SSRF por imagen, proveedor fijo, texto/imagen, JSON y terminación, rechazo y sanitización de errores. No sustituyen la prueba de despliegue real.

## Modelo y límite gratuito verificados el23/11/2026

Se selecciona `@cf/qwen/qwen3.8-27b`, con visión y texto en la [documentación oficial Cloudflare](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/). El [repositorio oficial de Qwen publica Apache2.0](https://huggingface.co/Qwen/Qwen3.8-27B/raw/main/LICENSE); no requiere aceptar la licencia Meta. No se distribuyen pesos ni se ejecuta IA local.

Cloudflare incluye10000neuronas diarias gratuitas; Qwen3.8 no aparece en la lista de modelos que requieren pago en la [tarifa oficial](https://developers.cloudflare.com/workers-ai/platform/pricing/). Esto no equivale a uso ilimitado ni garantiza que una cuenta concreta ya tenga acceso. El consumo depende de entrada/salida y las cuotas se restablecen a00:00UTC. En Workers Paid el exceso puede facturarse: este código no cambia el plan de la cuenta ni impone un contador global de facturación; conservar Workers Free para un corte gratuito efectivo.
