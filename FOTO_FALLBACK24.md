# Respaldo de análisis de comida por foto

El servidor mantiene Gemini como primera ruta. Sólo para `photo`, un rechazo de cuota (429), saturación (503) o timeout puede usar una única llamada a Groq `qwen/qwen3.8-27b`. El plazo total se comparte, sin reiniciarlo. No se cambia de proveedor ante autenticación/configuración incorrecta, bloqueo de seguridad, respuesta aceptada malformada o incompleta. No se aplica a etiquetas, máquinas, voz ni conversación.

`GROQ_VISION_MODEL` permite configurar el modelo; utiliza la clave Groq existente exclusivamente en servidor. `aiConfiguration().routingVersion` pasa a 3 y declara el fallback con máximo un intento. Los valores nutricionales siguen pasando por la validación del servidor y requieren confirmación; el respaldo no modifica el contrato de resultados.

Fuentes oficiales comprobadas el 22/11/2026:
- https://console.groq.com/docs/vision — modelo multimodal y JSON, hasta tres imágenes.
- https://console.groq.com/docs/rate-limits — plan gratuito publicado, límites compartidos por organización y sujetos al primer umbral alcanzado. No garantiza uso ilimitado ni el plan concreto de esta cuenta.

Prueba real con la clave ya configurada: imagen PNG sintética uniforme verde (ningún dato de usuario), HTTP 200, modelo qwen/qwen3.8-27b, finish_reason stop, JSON {"color":"green"}, 1333 tokens, 451 ms. No se activó facturación. Esto demuestra acceso y formato; no demuestra precisión nutricional ni garantiza capacidad futura.

Pruebas: tests/photo-fallback24.mjs cubre éxito primario, 429/503/timeout, ausencia de clave alternativa, límites de intentos y plazo, exclusión de auth/safety/JSON malformado y otras funciones. audit-ai.mjs y audit-http.mjs mantienen cobertura de seguridad y contratos.

Prueba de alimento real público: [Banana in a plate, Rameshng, CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:Banana_in_a_plate.JPG). Se ejecutaron dos llamadas Groq usando el prompt real de comida y simulando únicamente el rechazo Gemini429. La primera fue rechazada correctamente por el validador porque un ingrediente no tenía gramos positivos. La segunda pasó validación en 1074 ms: rango 105–300 kcal, pregunta de número de piezas y macros estimados. Su descripción mezclaba piel y fruta, lo que evidencia la necesidad de preguntar y confirmar la porción comestible: el éxito técnico no demuestra exactitud nutricional. No hubo datos de usuarios ni persistencia en sus diarios. Evidencia técnica: ../v242-validation/photo-fallback-real.json.
