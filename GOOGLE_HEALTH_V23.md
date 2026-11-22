# Google y Health Connect — integración V2.3

## Activación del servidor

Crear cliente OAuth de tipo aplicación web en Google Cloud, con pantalla de consentimiento y usuarios de prueba si el proyecto está en modo pruebas. Registrar exactamente `https://vera-beta.onrender.com/auth/google/callback` como URI de redirección autorizado.

Guardar únicamente en Render: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`. Son credenciales diferentes de Gemini y Places. No se empaquetan en la APK. La conexión solicita `openid email profile`, no concede permisos de salud por sí sola. Los permisos de salud se conceden en Android.

Rutas: GET autenticado `/google/status`; POST JSON autenticado `/google/start`; GET público `/auth/google/callback`. La APK abre Google en navegador externo y consulta estado autenticado al volver. No se usa una WebView para capturar credenciales. Estado de un solo uso, PKCE S256, nonce y verificación criptográfica RS256 de ID token (audiencia, emisor, caducidad). Se guarda subject/email de identidad, nunca tokens Google. Una identidad Google no puede vincularse a dos cuentas Vera.

El acceso obligatorio informa si la configuración del servidor está pendiente; no simula una conexión. Cambiar de cuenta está disponible en todos los bloqueos. Health Connect en esta implementación requiere Android 14 o posterior. Las autorizaciones se consultan de nuevo en cada evaluación del acceso y al volver del navegador; no se sustituyen por preferencias locales.

## Datos de salud

Lectura y escritura solicitadas: pasos, sesiones de ejercicio (incluido ciclismo), sueño, peso, nutrición e hidratación. Los permisos pueden rechazarse o revocarse desde Android; la app nunca los concede por su cuenta. No se piden rutas GPS ni permisos de otros datos no utilizados.

Exportación sólo después de confirmación del servidor, con versión del registro y coincidencia exacta del contenido. Nunca se reexportan registros importados. Identificadores de cliente estables incluyen cuenta, tipo e ID; los reintentos con igual versión son idempotentes. La lectura excluye registros creados por este exportador para evitar duplicar alimentos, suplementos o líquidos. No se actualizan registros de terceros.

Comidas/suplementos exportan los valores conocidos; suplementos incluyen su líquido en nutrición y volumen de hidratación una vez. Peso se exporta como medición. Un registro histórico que sólo contiene fecha usa mediodía local para peso, alimentación o bebida; no significa que el usuario haya indicado esa hora. Sueño, pasos y ejercicio requieren horas de inicio y fin explícitas. El sueño con minutos despierto sin intervalos de vigilia se conserva en Vera y no se exporta como sueño continuo. Los borrados confirmados en Vera y cambios de tipo (por ejemplo, quitar el líquido de un suplemento) eliminan únicamente los identificadores propios correspondientes en Health Connect. No se eliminan registros de terceros.

La sincronización funciona mientras la aplicación está activa y al volver a ella, no como servicio permanente en segundo plano. Google Fit debe compartir sus datos con Health Connect. No se presupone acceso directo a Fit o Google Health cloud.

## Validación y límites

- `tests/audit-google23.mjs`: estado, PKCE, firma, nonce, audiencia, emisor, fechas, repetición e aislamiento de identidad.
- `tests/audit-google-http23.mjs`: frontend real contra servidor HTTP, cuerpo JSON, autenticación, callback seguro y cambios de sesión.
- `tests/audit-android-native.py`: compilación API35, 17 casos origen y 8 MIME (incluido SVG con nosniff).
- Requiere comprobación final en teléfono real: consentimiento Google con credenciales reales, concesión/revocación Health Connect, lecturas/escrituras y voz. Las pruebas de compilación no equivalen a una prueba de dispositivo.

Fuentes oficiales consultadas 22/11/2026:
- https://developers.google.com/identity/protocols/oauth2/native-app
- https://developer.android.com/health-and-fitness/health-connect/write-data
- https://developer.android.com/health-and-fitness/health-connect/migration/fit (soporte Fit API hasta finales de 2026)
- https://developer.android.com/reference/android/health/connect/datatypes/ExerciseSessionType
