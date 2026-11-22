# Análisis de fotos: cuotas y proveedores (22-11-2026)

La interfaz distingue QUOTA_DAILY_PHOTO (cupo diario de la aplicación) de AI_RATE_LIMIT (proveedor), conserva código HTTP, Retry-After, resetAt y limit, y no atribuye todas las fotos a Gemini. La foto puede consultar el caché del servidor aunque exista un cooldown; un fallo nunca guarda comida. La revisión y confirmación siguen siendo obligatorias.

Fuentes oficiales consultadas:
- Groq visión: https://console.groq.com/docs/vision . El catálogo documenta qwen/qwen3.8-27b, hasta tres imágenes; comprobar disponibilidad en la cuenta antes de configurar un fallback. Muse Spark está en acceso limitado.
- Groq límites: https://console.groq.com/docs/rate-limits . Límites por organización y modelo; la consola de la cuenta es la referencia efectiva. Tener dos proveedores no elimina las cuotas de ninguno.
- Gemini límites: https://aistudio.google.com/docs/rate-limits . RPM, TPM y RPD por proyecto; varias claves del mismo proyecto comparten cuotas. El reinicio diario de Gemini se basa en hora del Pacífico, diferente del cupo propio de Vera en UTC.
- Gemini precios: https://aistudio.google.com/docs/pricing . El acceso gratuito depende del modelo y nivel; no implica visión ilimitada.
- OpenRouter alternativa investigada: https://openrouter.ai/pricing y https://openrouter.ai/models?pricing=free . Modelos gratuitos con cuotas y disponibilidad variables; NO integrado porque Vera está restringida a Groq y Gemini. No se usan cuentas ni claves adicionales para eludir límites.

Pruebas: tests/food-photo24.mjs, tests/photo-api24.mjs y 31 comprobaciones audit-frontend-unit.mjs pasan en VM. Verifican duplicados, cambio de cuenta, cancelación, timeout, respuesta malformada, error de proveedor, ausencia de guardado implícito, metadata y acceso al caché durante cooldown. No sustituyen una prueba física del móvil.
