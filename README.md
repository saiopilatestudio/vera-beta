# VERA 2.0 beta

Aplicación Android y servidor de VERA, build 200. La IA se ejecuta exclusivamente en Groq y Gemini, con una ruta explícita por función. No incluye modelos, motores de inferencia ni descargas de IA local. Los formularios, el diario y los respaldos siguen guardando datos en el dispositivo.

## Reparto de funciones

| Función | Proveedor |
|---|---|
| Conversación habitual e introducción | Groq |
| Dictado y transcripción | Groq |
| Fotos de comida, máquinas y etiquetas | Gemini |
| Revisión avanzada elegida expresamente | Gemini |
| Lectura de respuestas en español | Gemini |

No hay sustitución automática de proveedor al fallar o faltar una clave. Cada función requiere la configuración correspondiente; una función de Groq no debe bloquearse sólo porque falte configurar Gemini. La app verifica `/capabilities` y la ruta concreta antes de enviar contenido para IA. Consulta `docs/release2/CONFIGURACION-SERVIDOR.md` para el contrato, los modelos y los requisitos del servicio.

## Entrega Android

La APK se construye desde `beta-android/`, package `app.vera.coach.visionbeta`, versionName `2.0 beta`, versionCode `200`. `android/` e `ios/` son proyectos Capacitor auxiliares y no corresponden al binario entregado.

La firma V2 es nueva, autorizada por el propietario porque no conserva la anterior. No permite actualizar directamente la APK antigua. Antes de desinstalarla, exporta el respaldo JSON desde Perfil y guarda una copia fuera de la app. El manual acompaña a la APK. Nunca incluyas la copia privada de firma en un repositorio.

## Servidor

Requiere Node 24. Ejecuta `npm ci`, `npm test` y `npm start`. Para desarrollo, copia `.env.example` a `.env`, configura credenciales de prueba y ejecuta `node --env-file=.env server.mjs`. No subas `.env` a Git.

Las claves Groq y Gemini se configuran únicamente en el servidor. Instalar la APK no despliega el backend, no crea claves ni configura facturación. Esta entrega no cambia producción. Los errores de red, configuración y cuota se muestran; no generan respuestas locales sustitutas. El prefijo `openai/` de un modelo servido por Groq no significa que se use la API de OpenAI.

La voz se genera remotamente y se reproduce como audio; no utiliza TTS local. La prospección administrativa con búsqueda web no está implementada y devuelve un error explícito. Las funciones disponibles no incluyen automáticamente vídeo, lectura de PDF o todas las capacidades comerciales de los proveedores.

## Datos y comprobaciones

Se mantiene el diario local con sincronización manual. Fotos originales, perfil, conversación y memoria no tienen sincronización integral. El respaldo JSON no incluye contraseñas, permisos ni fotografías originales. Importarlo reemplaza datos locales: revisa antes de sincronizar.

Las pruebas de código utilizan cuentas sintéticas, SQLite temporal y transporte IA simulado. La compilación y firma no sustituyen pruebas de instalación, cámara, biometría, Health Connect e inferencia real en un teléfono. Los resultados exactos de la entrega están en sus evidencias, con las limitaciones pendientes.

El archivo público histórico `owner.json` está desactivado por defecto. Configura el administrador mediante variables privadas y una contraseña nueva. No reactives el acceso heredado. Esta entrega no borra el historial remoto.

Los informes en `docs/audit2026`, `docs/release103` y los documentos anteriores a V2 son históricos: no son instrucciones de configuración de esta entrega. La documentación vigente está en `docs/release2`. Sus revisiones distinguen propuestas, cambios integrados y pruebas pendientes.
