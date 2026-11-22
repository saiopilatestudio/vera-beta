VERA 2.1 beta - Lectura inicial

Lee README.md y docs/release21/README-V21.md. El manual PDF acompaña a la APK.

Actualiza encima de la V2.0 entregada: se conserva la firma y se aumenta versionCode a 210. No desinstales V2.0. Exporta un respaldo antes de actualizar. Versiones con otra firma requieren respaldo y reinstalación.

Toda la IA usa Groq y Gemini desde el servidor. No hay modelos ni voz local, ni claves API en el móvil.
V2.1 incorpora tema blanco/lima, captura histórica al diario, especialistas y plan semanal, guardado automático por cuenta y métricas de nutrición/peso.

Health Connect requiere Android 14+ y permisos del sistema. Se refresca automáticamente tras volver a la app; Google Fit sólo aporta datos si los comparte con Health Connect.
La búsqueda integrada de gimnasios necesita GOOGLE_PLACES_KEY, distinta de Gemini. Si falta, puedes abrir Maps o guardar la sede manualmente.

Los ZIP son independientes: el primero instala la app; el segundo contiene código y firma privada. No publiques el segundo ZIP completo ni PRIVADO-NO-SUBIR-A-GITHUB.
Consulta VERIFICACION.txt para el estado final del despliegue y las pruebas.
