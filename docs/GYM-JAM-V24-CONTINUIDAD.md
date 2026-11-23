# GymJam V2.4 — continuidad del servidor

La entrega 2.4.3 incluye esta función en el servidor y en la APK.

## Integración

`gym-jam24.mjs` exporta `gymJamAction24(path, uid, input)`. `server.mjs` incorpora rutas POST create, join, state, leave, propose, start, end y music bajo `/gym-jam/`, tras autenticación y vinculación Google, antes de cualquier cuota IA. Capacidad pública: `features.gymJam=true`.

Crear/unirse exige `acceptSharing:true`. Se comparte nick y progreso en puntos/series objetivo, no UID, email, peso, cargas, repeticiones detalladas, sueño o nutrición. Sólo miembros activos acceden al estado; sólo el anfitrión propone, inicia, termina y cambia enlace musical.

Máximo 20 personas, seis horas. Código criptográficamente aleatorio de ocho caracteres y QR local del código. No se envía a servicios de QR externos. Una tabla de participación con UID único impide crear/unirse simultáneamente a varias salas; el límite de miembros se valida dentro de SQL transaccional.

## Puntuación

Se leen exclusivamente registros confirmados en `diary_sync`, nunca puntos enviados por el cliente. Triggers mantienen sólo UID/ID y tiempos de creación/edición de cada registro. Los registros históricos modificados no pasan por recién creados. Se filtran cuenta participante, periodo posterior al inicio/unión, fecha local válida de sesión, tipo entrenamiento, ejercicio exacto normalizado y series válidas. No se cuentan importaciones Health Connect.

Cada ejercicio puntúa hasta sus series objetivo; añadir series por encima no suma. El porcentaje 0–100 representa cumplimiento de la propuesta, no fuerza relativa. No incentiva más peso ni exceso de series. El resultado se congela al terminar. Un registro manual confirmado no demuestra físicamente que se haya realizado: no se afirma detección de trampas ni certificación del ejercicio.

La zona horaria viene del dispositivo, validada con Intl. El anfitrión fija hasta 12 ejercicios y un máximo total de 40 series; son límites de entrada, no una recomendación de entrenamiento.

## Música

Sólo se guarda un enlace HTTPS explícito con host exacto `open.spotify.com`, `spotify.link` o `spotify.app.link`, sin credenciales ni puertos arbitrarios. No se descarga la URL, no se manejan tokens Spotify ni se crea automáticamente una Jam. Los usuarios siguen el enlace y controlan Spotify.

## Pruebas

- `tests/gym-jam24.mjs`: consentimiento, privacidad, autorización, cómputo desde diario real, exclusión de históricos/fechas ausentes, límite por ejercicio, cierre congelado, Spotify allowlist, creación/unión concurrentes y aforo/caducidad.
- `tests/gym-jam-http24.mjs`: HTTP real con SQLite, 401 sin sesión, 403 Google, 404 no miembro, 403 no anfitrión, rechazo de puntos enviados, ausencia de identificadores privados, salida tras terminar y cero consumo IA.

Revisión independiente: se corrigió salida de una sala terminada; la salida no reescribe su clasificación histórica.

## Cuotas semanales coordinadas

`accounts.mjs` también incluye bucket `weeklyWorkouts` independiente (20 generaciones nuevas/día por defecto, `VERA_WORKOUT_DAILY_LIMIT`) para `/weekly-plan` y `/workouts/weekly`, con reserva idempotente y devolución en fallo. Código `QUOTA_DAILY_WORKOUT` y metadatos de renovación UTC. El agente de planes verificó ambas rutas, cache y reembolso.
