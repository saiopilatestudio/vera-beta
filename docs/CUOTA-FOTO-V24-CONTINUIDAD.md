# Cuota y caché de fotos — continuidad local V2.4

SIN compilar ni desplegar.

- Las fotos de comida usan contador independiente `photo_quota24`, 30 análisis nuevos/día UTC por defecto, configurable con `VERA_PHOTO_DAILY_LIMIT`. El contador general `quota` existente no se cambia ni reinicia.
- `QUOTA_DAILY_PHOTO` diferencia límite local de `AI_RATE_LIMIT` del proveedor. Incluye Retry-After hasta medianoche UTC, resetAt y limit.
- `/photo` consulta caché antes de reservar cuota. Clave por cuenta, hash de imagen, aclaración, versión del prompt y configuración completa de modelos Gemini/Groq fallback. Repetir exactamente foto/contexto no gasta otra reserva y funciona aun con cuota local agotada.
- Peticiones idénticas concurrentes comparten cálculo. La caché almacena hash y respuesta, nunca imagen original, API keys ni token de usuario. Caduca a las 24 h y conserva como máximo 100 entradas por cuenta compartidas con etiquetas.
- Fallos del proveedor y validación se reembolsan. Reserva de foto individual hace idempotente la devolución; un fallo no devuelve cuotas de otra llamada ni guarda un error en caché.
- La caché no elimina límites de los proveedores ni garantiza uso ilimitado gratuito. Cambiar la aclaración/imagen puede requerir otro análisis.

Pruebas: photo-quota24, photo-quota-http24 (HTTP y SQLite reales, upstream simulado), acceptance103 y audit-ai-http (13 grupos). El test HTTP verifica cuatro solicitudes idénticas concurrentes con un solo cálculo, cuota general agotada que no bloquea fotos, errores reembolsados y resultado cacheado disponible tras límite local.

La auditoría antigua usaba una misma imagen con respuestas simuladas distintas: ahora aporta aclaración única por escenario para probar cada respuesta nueva sin confundir caché con un fallo del proveedor.
