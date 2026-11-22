# VERA 2.2 beta

Android build 220. Actualiza V2.0/V2.1 con la misma firma. Toda la IA se ejecuta en Groq o Gemini desde el servidor. No hay claves API ni modelos locales en la APK.

## Cambios 2.2

- Acceso online obligatorio, sin entrada al diario desconectado. Caché de recuperación para envíos interrumpidos; confirmaciones del servidor y conflictos visibles, con aislamiento entre cuentas.
- Alta inicial obligatoria con perfil, objetivos y entrenamiento; sueño y agua editables en Perfil y guardados en el servidor.
- Identidad gráfica y navegación móvil nuevas: blanco, lima, celeste, degradados suaves; icono nativo actualizado.
- Voz Gemini inicia al solicitarla sin un segundo botón de reproducción.
- Cinco referencias Zumub verificadas, suplementos con kcal explícitas y 25 campos de micronutrientes; comidas y suplementos sumados. Agua, barras, círculo de macros y puntos de peso.
- 876 nombres de ejercicios en español, con identificadores y alias originales conservados.
- Juntos: salas privadas, objetivo conjunto, duelo de series y constancia de siete días, progreso, ánimo y revancha. Declaraciones de sesión, no verificación por sensores.
- Consulta normal: una llamada de IA. Revisiones explícitas con especialistas. Contexto acotado con cobertura explícita; revisión automática diaria como máximo, con tres registros y perfil inicial. Límites gratuitos del proveedor siguen vigentes.
- Google Places: integración servidor con clave privada, filtro de gimnasios y campos limitados. Activación requiere GOOGLE_PLACES_KEY y proyecto con facturación. Su ausencia se informa; no se presenta OpenStreetMap como Google.

## Validación

`npm test` incluye regresión, HTTP/SQLite, aislamiento de cuentas, perfil y diario, IA simulada, nutrición, retos, ejercicios y acceso online. `tests/audit-android-native.py` comprueba puente/orígenes y compila Java; `beta-android/build.py` compila y verifica firma/assets. Evidencias de entrega distinguen simulaciones, proveedores reales y pruebas visuales; no acreditan ejecución en todos los teléfonos.

Fuentes y alcance: [nutrición](docs/NUTRICION-V22.md), [Juntos](docs/INVESTIGACION-JUNTOS-V22.md). Documentos release21 y anteriores son históricos.

Visión y revisión Gemini usan `gemini-3.5-flash-lite`, verificado con texto e imagen sintéticos el 22/11/2026 después de observar timeouts en Hydrogen/3.8 Flash. La voz conserva `gemini-3.8-flash-lite-tts`.

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
