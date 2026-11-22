# VERA 2.0 beta: configuración del servidor

Actualizado el 22/11/2026. APK `versionName=2.0 beta`, `versionCode=200`, paquete `app.vera.coach.visionbeta`.

**Compilar o instalar la APK no actualiza Render ni activa las APIs.** El 22/11/2026 se publicó y desplegó V2 en https://vera-beta.onrender.com, commit 7b35db3c4991d845802da07dab1f4567d9cc70f6. Render confirmó el servicio activo a las 02:18:58 (Europe/Paris). Se conservaron las variables privadas de Groq, Gemini y la base Turso existente. La APK exige capacidades V2 con reparto de IA versión 2 antes de enviar una solicitud de IA. Un servidor anterior bloqueará estas funciones hasta actualizarse.

## Reparto fijo, sin sustitución automática

| Función / clave de ruta | Proveedor | Modelo predeterminado | Variable de modelo |
|---|---|---|---|
| Conversación estándar / `coach` | Groq | `openai/gpt-oss-120b` | `GROQ_CHAT_MODEL` |
| Presentación inicial / `intro` | Groq | `openai/gpt-oss-120b` | `GROQ_CHAT_MODEL` |
| Análisis profundo explícito / `coach_deep` | Gemini | `gemini-4-argon` | `GEMINI_DEEP_MODEL` |
| Fotos de comida, máquinas y etiquetas / `photo`, `machine`, `label` | Gemini | `gemini-4-hydrogen` | `GEMINI_VISION_MODEL` |
| Dictado / `listen` | Groq | `whisper-large-v3-turbo` | `GROQ_SPEECH_MODEL` |
| Lectura en español / `speak` | Gemini | `gemini-3.8-flash-lite-tts` | `GEMINI_TTS_MODEL` |

El prefijo `openai/` del identificador del modelo GPT-OSS designa un modelo servido por **Groq**: el código no llama a la API de OpenAI. Los únicos destinos de inferencia son `api.groq.com` y `generativelanguage.googleapis.com`. No hay modelos ni motores de IA locales. El diario, las validaciones, el catálogo estático y el lector QR pueden seguir funcionando en el dispositivo sin constituir inferencia.

Cada ruta necesita únicamente la clave de su proveedor. Sin Gemini, la conversación estándar, la presentación y el dictado con Groq siguen disponibles. Sin Groq, las rutas Gemini mantienen su propia disponibilidad. No se cambia de proveedor ni se reintenta automáticamente ante errores. `AI_PROVIDER` y `GROQ_VISION_MODEL` ya no seleccionan rutas: retirar estas variables obsoletas del despliegue. Una clave antigua de otro proveedor no se utiliza.

## Variables y despliegue

Configurar secretos en el entorno privado del servidor, nunca en Git, `www` o la APK. `.env.example` es una plantilla; Node no la carga automáticamente. El servidor debe recibir las variables desde Render o un mecanismo de entorno explícito.

- `GROQ_API_KEY`: clave privada Groq. `GEMINI_API_KEY`: clave privada de Gemini Developer API. El código no utiliza credenciales Vertex AI.
- Variables de modelo de la tabla: deben señalar modelos compatibles y disponibles para la cuenta. La presencia de la clave no demuestra acceso al modelo ni saldo. Si se configura un modelo de Gemini incompatible con JSON, visión o TTS, la ruta falla explícitamente.
- `GEMINI_TTS_VOICE=Kore`: voz configurable compatible con Gemini TTS. `speak` admite texto de 1 a 3500 caracteres y devuelve `audio/wav` completo, PCM 24 kHz, mono, 16 bits. No depende del lector de voz Android.
- `VERA_AI_TIMEOUT_MS=45000`: límite de cada llamada, acotado entre 1 y 75 segundos. El coach comparte un plazo total de 65 segundos entre especialistas y coordinador.
- `VERA_DAILY_LIMIT=30`: operaciones de IA completadas por cuenta/día. Los errores liberan la reserva; el proveedor podría haber facturado una llamada fallida o incompleta. Un análisis de coach puede realizar varias llamadas dentro de una operación. Máximo una operación simultánea por cuenta y 20 globales.
- `NODE_VERSION=24`, `HOST=0.0.0.0` en Render; conservar el `PORT` asignado por la plataforma.
- `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`: conservar la base existente y su token. No sustituirla por SQLite efímero. En Render se exige base persistente.
- `VERA_OWNER_EMAIL` y `VERA_OWNER_PASSWORD`: credenciales privadas del panel; contraseña de al menos 16 caracteres. `VERA_ALLOW_LEGACY_OWNER_FILE=false`: mantener desactivado el antiguo archivo público `owner.json`; rotar cualquier contraseña correspondiente a hashes publicados.
- `VERA_ORIGINS=capacitor://localhost,https://localhost`: orígenes de la app; añadir sólo dominios web concretos que se utilicen.

El origen actual de la APK es `https://vera-beta.onrender.com`. Actualizar el servicio existente desde la fuente entregada con `npm ci --omit=dev` y `node server.mjs`, sin borrar tablas, cuentas, sesiones, nicks ni diarios. `render.yaml` contiene las variables de ambos proveedores y no restaura modelos locales. Antes de un despliegue real, disponer de copia de seguridad verificable y revisión anterior para reversión. En esta entrega se realizó el despliegue indicado al inicio, con Node 24.22.3, `npm ci --omit=dev` y `npm run start` (ejecuta `node server.mjs`). Se configuró `/health` como comprobación de salud. No se borraron tablas ni se sustituyeron las credenciales de Turso.

## Contrato de capacidades y solicitudes

`GET /capabilities` devuelve:

```json
{
  "apiVersion": "2.0",
  "ai": {
    "routingVersion": 2,
    "providers": ["groq", "gemini"],
    "execution": "cloud-only",
    "localInference": false,
    "verification": "configuration-only",
    "speechOutput": "remote",
    "routes": {
      "coach": {"provider": "groq", "model": "openai/gpt-oss-120b", "configured": true},
      "coach_deep": {"provider": "gemini", "model": "gemini-4-argon", "configured": false}
    }
  },
  "persistence": "local-with-manual-sync"
}
```

El ejemplo abrevia `routes`; la respuesta real incluye las ocho claves de la tabla. `configured` sólo indica presencia de la clave. `GET /health` responde `ok` sin afirmar que la inferencia funcione. El cliente valida proveedor y configuración de la ruta concreta, además de sesión y consentimiento de envío remoto; no exige tener configurados ambos proveedores a la vez.

- `POST /coach`: `{question, mode:'standard'|'deep', ...contexto}`. El modo omitido significa estándar; la elección profunda es explícita, nunca inferida de palabras del mensaje. Los especialistas y coordinador usan el mismo proveedor elegido. Gemini profundo usa `thinkingLevel:'low'` y máximo 8192 tokens, incluyendo pensamiento; una respuesta truncada se rechaza.
- `POST /speak`: `{text}`. Devuelve WAV validado o error JSON. La reproducción se solicita explícitamente en el cliente; no se ejecuta TTS local.
- Todas las rutas de IA requieren cuenta válida. Clave ausente: `503 AI_NOT_CONFIGURED`; configuración/modelo inaccesible: `503 AI_CONFIG`; límite de proveedor: `429 AI_RATE_LIMIT` con `Retry-After`; tiempo agotado: `504 AI_TIMEOUT`; salida inválida: `502`. No se expone el cuerpo de error del proveedor.

## Privacidad, validación y límites

Las claves sólo están en el servidor. Las solicitudes al proveedor no incorporan token de sesión, contraseña ni correo como parte del contexto estructurado; un texto libre puede contener datos personales escritos por el usuario. El coach añade únicamente registros de la cuenta autenticada, limita contexto y declara su cobertura. Las fotos se envían en línea, sin subida a Files API ni URL arbitraria.

Gemini de texto/visión usa `generateContent` sin estado conversacional remoto. TTS usa `POST /v1beta/interactions` con `store:false`, sin `previous_interaction_id`, tareas en segundo plano ni herramientas. **Esto desactiva el almacenamiento de la interacción para recuperación, pero no equivale a garantizar ausencia de registros, retención o usos de datos por el proveedor.** Revisar las condiciones y el nivel de cuenta de Groq y Google antes de enviar información sensible. Para ofrecer la app a usuarios del EEE, Suiza o Reino Unido, las condiciones actuales de Gemini exigen un servicio de pago: la API debe utilizar un proyecto asociado a una cuenta de facturación activa. El servicio gratuito excluye información personal o sensible; también existen restricciones al asesoramiento médico. Esta beta se plantea como bienestar para adultos, sin diagnóstico ni tratamiento. [Condiciones oficiales de Gemini](https://aistudio.google.com/docs/terms).

Se acotan cuerpos HTTP de entrada/salida, imágenes, grabaciones, texto y WAV. Las respuestas incompletas, bloqueadas, JSON inválido o audio malformado se rechazan. Las propuestas de registros se validan y requieren confirmación de la persona; no se escriben automáticamente. Las indicaciones deportivas distinguen estimación y observación, no certifican técnica desde una foto y evitan aumentar cargas sólo por calendario o un RIR. Esto es una pauta de generación, no una validación clínica de las respuestas.

La prospección comercial automática permanece desactivada con error explícito; no se inventan contactos. Google Places, si se configura por separado, es búsqueda de lugares y no un proveedor de inferencia.

## Verificación realizada y pendiente

Las pruebas automatizadas usan cuentas sintéticas, SQLite temporal y respuestas controladas de ambas APIs. Comprueban routing explícito, claves independientes, ausencia de sustitución, aislamiento entre cuentas, errores, cuotas, JSON, imágenes y WAV. No prueban facturación, disponibilidad de modelos, calidad de respuestas, pronunciación real ni latencia contra cuentas de producción.

Después de configurar un entorno de prueba propio: verificar capacidades, ejecutar una consulta estándar, otra profunda, una foto, dictado y lectura con datos no sensibles; comprobar audio real y comportamiento al retirar cada clave. No marcar la integración externa como verificada sólo porque `/health` o `configured` sean positivos.

## Referencias oficiales consultadas

- [Gemini: generación de texto y REST generateContent](https://aistudio.google.com/docs/text-generation?generate-content=true).
- [Gemini: imágenes](https://aistudio.google.com/docs/image-understanding) y [salidas estructuradas](https://aistudio.google.com/docs/structured-output).
- [Gemini: generación de voz, español, WAV e Interactions](https://aistudio.google.com/docs/speech-generation).
- [Interactions y almacenamiento](https://aistudio.google.com/docs/interactions-overview).
- [Gemini: niveles de pensamiento](https://aistudio.google.com/docs/thinking?generate-content=true).
- [Groq: transcripción](https://console.groq.com/docs/speech-to-text).


## Comprobación pública del servidor

El 22/11/2026 a las 02:19:24 (Europe/Paris), `/health` devolvió HTTP 200 `ok` y `/capabilities` HTTP 200 con API 2.0, ejecución cloud-only, inferencia local desactivada, audio remoto y las ocho rutas Groq/Gemini configuradas. `PRODUCCION-V2.json` registra la evidencia. El arranque completó la inicialización de la base configurada; no se consultaron usuarios ni se crearon cuentas. Esta comprobación no acredita inferencia de todas las rutas ni funcionamiento en un teléfono.
