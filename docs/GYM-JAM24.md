# GymJam — implementación y comprobaciones

GymJam añade a JUNTOS una sala privada de entrenamiento con hasta 20 participantes y caducidad de seis horas. Para crear o entrar, cada persona acepta compartir su nick y progreso de esa sesión. El QR contiene únicamente el código de invitación: se genera y lee en el dispositivo, sin un servicio QR externo ni inferencia IA local.

El anfitrión propone ejercicios y series (1–6 por ejercicio, hasta 12 ejercicios y 40 series), puede copiar una sesión de su tabla semanal, iniciar y finalizar la sala. Al iniciar se fija la propuesta. El botón Entrenar abre un borrador con el nombre del ejercicio: no inventa una serie ni suma puntos. La clasificación proviene del servidor; muestra porcentaje del objetivo y series confirmadas, no fuerza absoluta, calorías ni peso corporal. La vista consulta actualizaciones cada 12 segundos mientras Juntos está visible. El resultado final se conserva al consultar la sala por su identificador.

La música es un enlace a una Jam creada en Spotify. Vera acepta HTTPS de open.spotify.com, spotify.link y spotify.app.link, sin credenciales ni puertos alternativos. No reproduce audio ni garantiza sincronización musical propia. La sesión y sus permisos se gestionan en Spotify; crear una Jam requiere Premium. El código de invitación debe compartirse sólo con los compañeros previstos.

Archivos: www/gym-jam24.js, www/gym-jam24.css, tests/gym-jam24-frontend.mjs. Backend: gym-jam24.mjs, propiedad del agente de backend.

Dependencia QR vendorizada: qrcode-generator, autor Kazuhiko Arase, MIT, commit 83b7e8fe3fddd3b0368dbafd6ce56995bd25e3c8, https://github.com/kazuhikoarase/qrcode-generator . Licencia conservada en www/qr-generator24.LICENSE. El decoder jsQR ya estaba distribuido con la app.

Pruebas VM pasan: consentimiento, doble pulsación, respuesta tardía de otra cuenta, puerta Google/Health, pausa de polling fuera de Juntos o app oculta, validación de enlaces y propuestas, escape HTML, ausencia de puntuación enviada y de registros ficticios, QR codificado y decodificado con bibliotecas reales, cancelación de lobby, conservación de ranking final y cierre del resultado. Esto no equivale a probar una sesión entre móviles físicos.

Demo visual aislada: work/build-ui-harness242.py genera work/v242-ui con datos ficticios y red remota bloqueada. No se incluye en el producto.
