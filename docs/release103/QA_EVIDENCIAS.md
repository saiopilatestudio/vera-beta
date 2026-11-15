# QA EVIDENCIAS

Android SDK 35: compiladas las clases Java con ECJ. apksigner verify y aapt2 dump badging sobre 1.0.2. Prueba de actualización U01 bloqueada.

node tests/acceptance103.mjs: rutas especializadas, límite concurrente de dos peticiones, devolución y separación por cuenta, registro de carga y RIR. Chromium: borrador de prensa recuperado al recargar y guardado como serie con 60 kg. Admin: login con credenciales de prueba, consulta de estado y captura. Capturas serie.png y admin.png en esta carpeta. Ensayos con datos locales sintéticos, sin tráfico facturable de IA.

## Verificación de esta entrega

Con Node 24 y base SQLite temporal, tests/http103.py ejecutó solicitudes HTTP desde tres cuentas de prueba. Comprobó el inicio del panel con cookie HttpOnly y CSRF, rechazo sin sesión, cierre y revocación, registro de usuarios, elección de nick, invitación por nick, exclusión de un tercero, aceptación, reintento de una serie sin duplicarla, visibilidad del resultado desde la otra cuenta y finalización del reto. También pasaron tests/admin103.mjs y tests/partners.mjs. Estos resultados corresponden al servidor local de esta entrega. La instalación in-place y las pruebas de cámara, biometría y Health Connect en un dispositivo físico quedan pendientes.
