# VERA 2.1 beta

Aplicación Android y servidor VERA, build 210. Interfaz clara en blanco y verde lima. Toda la IA se ejecuta en Groq o Gemini; no incluye modelos, OCR, voz ni motores de inferencia locales.

La guía vigente de esta edición está en [docs/release21/README-V21.md](docs/release21/README-V21.md). El manual PDF y las evidencias acompañan a la APK y especifican el estado de despliegue comprobado.

## Funciones V2.1

- Texto e imágenes de días anteriores: Vera prepara entradas con fecha; al confirmar se incorporan al diario y a la sincronización de la cuenta.
- Especialistas de entrenamiento, nutrición y recuperación revisan los datos por separado. Vera coordina siete días, muestra las razones y conserva el plan anterior si una revisión falla. Revisión automática opcional y opinión general a petición.
- Guardado local y sincronización automática por cuenta de registros y estado de perfil. Los conflictos se muestran; no se mezclan cuentas al cerrar sesión. El nickname se valida y recupera desde el servidor.
- Health Connect se actualiza al volver a la app y tras acciones, sin pulsar sincronizar por cada registro. Requiere Android 14+ y permisos del sistema. Google Fit sólo contribuye si comparte datos con Health Connect; no hay una integración OAuth directa con Google Fit.
- Métricas de energía, proteína, hidratos, grasas, fibra, vitaminas y minerales confirmados de comidas y suplementos. Distingue cero de desconocido, muestra cobertura y fuentes, y calcula medias diarias entre fuentes sin sumar consumos duplicados.
- Peso con selector todos/ayunas/otros, media diaria, media del periodo y tabla de fuentes/condiciones.
- Voz española y visión Gemini revisadas; timeouts compatibles con el arranque lento del servidor gratuito.

## IA y servicios

| Función | Servicio |
|---|---|
| Conversación habitual, dictado, coordinación semanal | Groq |
| Captura histórica por texto | Groq |
| Captura histórica con foto, alimentos, máquinas y etiquetas | Gemini |
| Revisión avanzada y audio en español | Gemini |
| Búsqueda de sedes de gimnasio | Google Places, con clave específica independiente |

Las claves sólo se guardan en el servidor. `/capabilities` devuelve API 2.1, rutas configuradas, sincronización automática y disponibilidad de Places. Configurado no significa que todas las peticiones reales estén garantizadas: los límites del proveedor se notifican sin simular respuestas ni activar IA local.

**Google Places necesita `GOOGLE_PLACES_KEY`; la clave Gemini no la sustituye.** Si no está configurada, la app lo explica y permite abrir Maps o guardar una sede manualmente. Un resultado de Maps no acredita el inventario de máquinas. Las fotos y placas de material se interpretan mediante Gemini y requieren revisión antes de guardar.

## Android y actualización

APK construida desde `beta-android/`, package `app.vera.coach.visionbeta`, versionName `2.1 beta`, versionCode `210`. Los directorios `android/` e `ios/` son proyectos Capacitor auxiliares, no el binario distribuido.

Se conserva la firma de la V2.0 entregada: **actualiza encima, sin desinstalar**. Exporta un respaldo previo. Una edición anterior con otra firma necesita respaldo y reinstalación; no pierdas los datos desinstalando sin copia. La carpeta privada de firma del ZIP 2 nunca debe publicarse.

## Servidor

Node 24. Instala con `npm ci`, verifica con `npm test` y arranca con `npm start`. Para desarrollo copia `.env.example` a `.env`, configura credenciales de prueba y usa `node --env-file=.env server.mjs`. Nunca publiques `.env`.

Render: `npm ci --omit=dev`, inicio `npm run start` y comprobación `/health`. Conserva las variables de la base Turso existente. Las claves Groq/Gemini y Places se administran en el entorno del servidor, no en la APK. Las rutas vigentes están documentadas en `docs/release21`; `docs/release2` conserva la configuración y evidencia de la edición anterior y no sustituye la guía V2.1.

El acceso público histórico `owner.json` continúa desactivado. Utiliza variables privadas para administración y no reactives contraseñas heredadas.

## Datos y límites

El respaldo JSON conserva estado local, sin contraseñas, tokens, permisos ni originales de fotos. Restaurarlo reemplaza el estado local; conserva siempre el original. La sincronización no sube archivos originales de fotos y vídeos.

Las pruebas incluyen lógica/HTTP, cuentas sintéticas, métricas, sincronización, permisos de origen Android, compilación y firma. También se ensayaron llamadas reales con datos sintéticos: voz breve y párrafo, visión, revisión avanzada, importación histórica y plan semanal. La evidencia distingue estas llamadas de las comprobaciones de producción.

La revisión visual en navegador y las pruebas automáticas no sustituyen la instalación, audio, cámara, biometría y Health Connect en un teléfono real. Los informes de `docs/audit2026`, `docs/release103` y `docs/release2` son históricos.
