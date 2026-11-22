# Revisión de integración y privacidad de IA - VERA 2.0 beta

Revisión especializada del 22/11/2026. Alcance: integración del servidor con Groq y Gemini, sin inferencia local. No se han utilizado claves reales ni realizado inferencias con cuentas de producción. La selección de proveedor es una decisión funcional de esta beta, no un resultado de comparación de calidad entre modelos.

## Selección técnica implementada

- Groq: conversación ordinaria y transcripción, conservando el adaptador ya probado con respuestas controladas.
- Gemini 4 Hydrogen para visión y Gemini 4 Argon para revisión avanzada explícita, según la selección del adaptador. Las fichas declaran entradas multimodales y salidas estructuradas; su capacidad general no acredita precisión en nutrición o técnica deportiva. [Hydrogen](https://aistudio.google.com/docs/models/gemini-4-hydrogen), [Argon](https://aistudio.google.com/docs/models/gemini-4-argon).
- Gemini 3.8 Flash-Lite TTS: lectura remota en español. Se recomienda petición unary y audio WAV. Es una elección por capacidad documentada, no una promesa de mejor voz o menor coste medidos en VERA. [Generación de voz](https://aistudio.google.com/docs/speech-generation).

## Contrato y errores

Cada operación debe anunciar proveedor, modelo y estado de configuración en `/capabilities`. Tener clave configurada no demuestra que el modelo responda o que la cuenta tenga acceso. La app valida la ruta concreta antes de enviar datos; una función sin clave no debe bloquear otras que sí estén configuradas.

Los únicos destinos de inferencia permitidos son Groq y Gemini. No se sustituye automáticamente un proveedor por otro ante errores, límites o ausencia de clave. El análisis avanzado es una elección explícita, sin clasificación oculta por palabras. La aplicación debe mostrar cuál procesa cada función.

El protocolo TTS usa el encabezado `x-goog-api-key`; la clave nunca debe estar en una URL, en JavaScript del cliente ni en la APK. La respuesta REST contiene bloques en `steps`, mientras que `output_audio` es una comodidad del SDK. Debe rechazarse una interacción incompleta y validarse contenido, tamaño, base64 y contenedor antes de entregar audio al móvil. [Referencia REST de Interactions](https://aistudio.google.com/api-reference/interactions-api/create-interaction).

La ruta avanzada necesita un presupuesto de salida que contemple razonamiento y respuesta. Reducir sólo el máximo de tokens puede cortar la respuesta antes de obtener contenido utilizable; el nivel de razonamiento también debe configurarse de manera explícita. Los límites y tiempos de la app se evalúan con inferencias reales antes de presentarlos como adecuados. [Guía de Argon](https://aistudio.google.com/docs/whats-new-gemini-4-argon#setting-output-token-limits).

## Datos y consentimiento

Para las peticiones Interactions se exige `store:false`; no se utilizan historial remoto, ejecución en segundo plano ni herramientas del proveedor. La API almacena interacciones por defecto y permite desactivar ese almacenamiento específico. Esto no equivale a una garantía global de retención cero. `generateContent` permanece soportado y puede emplearse para los flujos que no requieren Interactions. [Almacenamiento y retención](https://aistudio.google.com/docs/interactions-overview#data-storage-retention).

El consentimiento anterior que sólo nombraba Groq no debe convertirse silenciosamente en permiso para Gemini. La decisión debe renovarse y quedar ligada a la cuenta; no debe transferirse del invitado a un usuario autenticado. Al retirarla o cambiar de cuenta deben descartarse respuestas tardías y detenerse la reproducción remota.

Antes de usar datos reales, el propietario debe configurar el servicio conforme a su plan y región. Los términos vigentes de Gemini requieren servicios de pago para ofrecer clientes en EEE, Suiza y Reino Unido; también excluyen datos personales o sensibles del servicio gratuito. Esta condición afecta al despliegue con diarios reales, no a las pruebas locales con datos sintéticos. [Condiciones de Gemini API](https://aistudio.google.com/docs/terms).

## Comprobaciones de ingeniería necesarias

1. Configuración parcial: sólo Groq o sólo Gemini habilita exclusivamente sus rutas.
2. Proveedor desconocido, contrato antiguo o ruta no configurada: ningún POST de IA desde cliente.
3. Clave ausente, 401/403, 429, timeout, salida vacía o incompleta: error explícito sin respuesta inventada.
4. Límites de entrada y de lectura de respuesta; rechazo de redirecciones y errores upstream sin incluir datos personales.
5. Audio: estado completado, formato permitido, base64 válido, cabeceras WAV coherentes y límite de tamaño.
6. Cambio de cuenta o retirada de consentimiento durante foto, grabación, inferencia y reproducción: sin mezcla de datos.

## Estado de revisión de código

Leídos `ai-provider.mjs`, las rutas IA de `server.mjs`, la validación de modo/entrada, `.env.example` y `render.yaml` después de la integración Gemini. Verificado en código:

- Rutas fijas por función y ausencia de sustitución automática entre proveedores.
- Claves sólo en encabezados a destinos fijos; redirecciones rechazadas.
- Lectura HTTP limitada incluso si no hay Content-Length; errores externos sin incluir su cuerpo.
- Gemini con nivel de razonamiento `low` explícito, límite de 8192 tokens y rechazo de resultados truncados. Esto limita consumo; no acredita calidad ni latencia real.
- Exclusión de partes marcadas como pensamiento y control de estructuras malformadas.
- TTS sin historial remoto, con `store:false`, respuesta completada, base64 canónico y WAV PCM validado.
- Configuración parcial: cada proveedor habilita únicamente sus funciones; claves ausentes devuelven error.

Ejecutadas independientemente las **16 pruebas de adaptador/validación IA** y los **11 grupos HTTP/IA**; todos superados. La suite HTTP usa servidor y SQLite reales, pero sustituye el transporte de ambos proveedores por respuestas controladas, incluido un WAV sintético. No es una prueba de inferencia ni de inteligibilidad del español.

Sin hallazgos bloqueantes nuevos en esta revisión del servidor. La lógica de consentimiento y reproducción del cliente debe pasar su propia suite y la comprobación integrada final. Siguen pendientes llamadas reales, acceso a modelos/facturación, precisión en imágenes y reproducción en Android. El equipo principal debe regenerar los artefactos y repetir las pruebas afectadas por cualquier cambio posterior.


