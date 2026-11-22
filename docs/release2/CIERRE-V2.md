# VERA 2.0 beta - cierre de la entrega

22/11/2026. APK compilada y firmada, package `app.vera.coach.visionbeta`, versionName `2.0 beta`, versionCode `200`. Nueva firma autorizada por el propietario. No es una actualización compatible sobre las firmas anteriores.

## Cambios integrados

- Eliminados todos los pesos y motores de IA local, OCR local, restauradores de modelos y puentes nativos de reconocimiento/síntesis de voz.
- Groq para conversación habitual, introducción y dictado; Gemini para fotos, etiquetas, revisión avanzada explícita y lectura española de respuestas. No hay sustitución automática de proveedor.
- Comprobación de capacidades por función antes de enviar contenido, consentimiento renovado y ligado a cada cuenta, cancelación de audio y protección contra respuestas o medios de sesiones anteriores.
- Editor de entrenamiento que corrige cifras estructuradas, convención de carga compartida, asistencia separada del volumen externo, límites coherentes, marcas por fecha y ventana exacta de 28 días.
- Contraste y controles del tema oscuro revisados; foco visible, áreas táctiles y distribución compacta mejorados. Marca visible V2.
- Reglas de entrenamiento más explícitas: RIR estimado, progresión contextual, prudencia ante dolor y límites de la fotografía estática.
- Se conservan las correcciones de la auditoría de backend, diario, nutrición, permisos y persistencia incluidas en esta fuente.

## Verificación final

Las 13 órdenes del comprobador integrado terminaron con código 0: cuatro suites heredadas, backend, acceso administrativo, adaptadores IA, HTTP, HTTP/IA, frontend, respaldo, política de assets Android y compilación/pruebas nativas.

Entre ellas: 31 grupos frontend; 17 pruebas de adaptadores IA; 13 grupos HTTP/IA con proveedores simulados; 13 grupos HTTP; 15 grupos backend; 3 comprobaciones de propietario; 4 comprobaciones cloud-only; 17 casos de autorización de origen Android. La prueba portable de respaldo verifica restauración, cancelación, límite de tamaño y exclusión de credenciales/fotos originales.

La APK verifica firma v2/v3, certificado seleccionado, identidad/versionado, alineación, CRC, cabeceras y coincidencia byte a byte de sus 19 assets con el código. El proceso de construcción emite un aviso de cabecera sobre un ZIP intermedio; la comprobación independiente del APK final no encontró discrepancias y aapt2/zipalign finalizaron sin avisos.

El manual PDF tiene ocho páginas, renderizadas e inspeccionadas. Los dos ZIP se comprueban mediante CRC y SHA-256 de sus archivos. Los logs y resúmenes se incluyen en las evidencias.

## Límites de la evidencia

No se ha instalado ni probado esta APK en un teléfono real. Quedan pendientes cámara, micrófono y reproducción, biometría, Health Connect, revisión visual en Android y uso integrado de las APIs desde el teléfono. Las pruebas de API sustituyen el transporte de los proveedores; no miden su precisión, latencia real o coste.

Esta entrega no despliega Render ni cambia cuentas reales. Para usar IA hay que desplegar el backend V2 y configurar las claves y condiciones del proveedor de cada función. Tener una clave presente no acredita que sea válida. El manual y CONFIGURACION-SERVIDOR.md describen la preparación.

El segundo ZIP contiene un archivo de código separado y una carpeta privada con la nueva clave de firma. No publicar ese ZIP completo. Guardar la clave para futuras actualizaciones. Antes de reinstalar, exportar y conservar fuera de la app el respaldo de la instalación anterior.

## Ampliación final: rediseño y comprobación de proveedores

La interfaz se ha rediseñado con una hoja visual coherente; ver REDISENO-VISUAL.md y TENDENCIAS-Y-DISENO.md. Se probaron directamente los proveedores con credenciales del propietario y texto sintético, sin pasar por Render ni utilizar datos del diario: chat Groq correcto, voz Gemini correcta (WAV válido de 103708 bytes), revisión avanzada Gemini rechazada con 429 AI_RATE_LIMIT. No se atribuye ese error a una causa específica no comprobada. La visión y transcripción reales no se ensayaron en esta ronda.

Render continúa bloqueado por un permiso técnico guardado. No se han instalado allí las claves ni desplegado el servidor V2, y Turso no se ha verificado con sus credenciales reales. Esta APK compilada no debe presentarse como servicio plug-and-play activado. Las claves de proveedores permanecen fuera de la APK y del ZIP de código.
