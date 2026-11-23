# VERA 2.4.6 beta

Android build 244, paquete `app.vera.coach.visionbeta`. La IA se ejecuta en Groq, Gemini y Cloudflare Workers AI. Las credenciales de los proveedores permanecen en el servidor. La APK se construye desde `beta-android/`; los proyectos Capacitor de `android/` e `ios/` son auxiliares.

## Hoy y Salud conectada en 2.4.4

La pantalla Hoy reúne los registros de la fecha local en cinco tarjetas. Una sesión compartida por Google Fit se muestra en Entrenamientos al recibirla de Health Connect, incluso con Hoy ya abierto. Las sesiones que cruzan medianoche se recortan al intervalo del día. Los permisos y el origen se consultan desde el propio resumen.

VERA inicia una lectura nueva al regresar del diálogo de permisos de Android. Cada lectura pertenece a la cuenta y sesión que la solicitó. Las respuestas tardías de otra sesión se descartan.

## Funciones de VERA

- En Cardio se pueden grabar ciclismo urbano, carrera y paseo con GPS y registrar natación con ritmo por 100 m. Health Connect aporta sesiones y métricas que haya compartido la aplicación de origen.
- El servidor conserva el protocolo de la APK 2.4.2. La nueva versión negocia el cambio automático de proveedor, con permiso por cuenta.

- Tabla semanal estructurada con ejercicios en español, series, repeticiones, RIR y descansos. Usa perfil e historial confirmados en el servidor. Semana actual/siguiente, petición personalizada y referencias anteriores; abrir una propuesta no registra actividad.
- Primera generación con perfil completo, Google/Health Connect y consentimiento remoto. Actualización tras cambios relevantes y tres minutos de inactividad o al finalizar sesión. Caché por cuenta, contexto y petición. El servidor valida la tabla y cambia de proveedor cuando procede. La tabla anterior sigue disponible durante la generación.
- Catálogo persistente SQLite/Turso: ocho etiquetas oficiales Zumub y fichas privadas confirmadas de alimentos y suplementos. Búsqueda por nombre, alias, variante y código de barras. Los aciertos no llaman a la IA.
- Fotografías conservan porción, unidad, cuatro valores de macros/energía y hasta 25 campos de micronutrientes. Caché exacta de lectura por cuenta durante 24 horas; no guarda la foto original. Las variantes propuestas requieren selección explícita.
- Completar suplementos antiguos sin duplicarlos, conservando fecha, dosis y líquido. Agua/leche y nutrientes de la mezcla siguen sumándose. Los valores no declarados no se convierten en cero.
- Respeto de Retry-After para no repetir inmediatamente consultas limitadas. Las cuotas gratuitas de los proveedores permanecen.

## Ejecutar y comprobar

Node 24: `npm ci`, `npm test`, `npm start`. Desarrollo con base de prueba y variables del servidor: `node --env-file=.env server.mjs`. Nunca publiques `.env`, claves API, clave de firma o su contraseña.

Render: instalación `npm ci --omit=dev`, inicio `npm run start`, comprobación `/health`. Conserva `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`. Las migraciones crean tablas propias sin borrar el diario. `/capabilities` declara API 2.4 y capacidades de tablas, catálogo y lectura nutricional.

Las pruebas cubren lógica, HTTP/SQLite, aislamiento de cuentas, cuotas, caché, etiquetas, tablas y edición. Las evidencias distinguen transportes simulados de llamadas reales con datos ficticios. La revisión web y compilación no equivalen a una prueba completa en un teléfono físico.

## Android y servicios

Instala encima de versiones con la misma firma; no desinstales para actualizar. El acceso completo requiere Android 14+, Google vinculado y permisos de Health Connect. OAuth Google está en modo de prueba; el administrador debe autorizar otras cuentas o completar la publicación del cliente.

Google Fit sólo aporta datos que comparta con Health Connect. Google Places requiere `GOOGLE_PLACES_KEY`, API y facturación propias; la clave Gemini no la sustituye. Una sede encontrada no acredita su inventario de máquinas.

Play Protect pertenece a Android y no se suprime desde Vera. Google Play requiere su proceso de publicación y revisión; tampoco garantiza ausencia de comprobaciones. Esta entrega es una APK beta firmada.

## Documentación

- [Tablas semanales e investigación](docs/WORKOUTS24.md).
- [Nutrición y fichas reutilizables](docs/NUTRICION-V24.md).
- [Catálogo, fuentes oficiales y ahorro](CATALOGO_AHORRO_V24.md).
- [Deportes y GPS](docs/SPORT24.md).
- [Sincronización de actividades](docs/HEALTH-CARDIO24.md).
- [Enrutamiento automático](docs/ENRUTAMIENTO-IA-V24.md).
- [Worker de respaldo](cloudflare/README.md).

Los documentos V2.3 y anteriores son históricos. El primer ZIP contiene la APK y el manual. El segundo incluye el código y las pruebas del despliegue.
