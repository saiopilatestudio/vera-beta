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

El 22/11/2026 se publicó y desplegó V2 en https://vera-beta.onrender.com, commit 7b35db3c4991d845802da07dab1f4567d9cc70f6. Render confirmó el servicio activo a las 02:18:58 (Europe/Paris). Se conservaron las variables privadas de Groq, Gemini y la base Turso existente. Tener una clave presente no acredita que todas las funciones, cuotas o condiciones de facturación estén resueltas. La configuración y el alcance de las pruebas se detallan en CONFIGURACION-SERVIDOR.md.

El segundo ZIP contiene un archivo de código separado y una carpeta privada con la nueva clave de firma. No publicar ese ZIP completo. Guardar la clave para futuras actualizaciones. Antes de reinstalar, exportar y conservar fuera de la app el respaldo de la instalación anterior.

## Ampliación final: rediseño y comprobación de proveedores

La interfaz se ha rediseñado con una hoja visual coherente; ver REDISENO-VISUAL.md y TENDENCIAS-Y-DISENO.md. Se probaron directamente los proveedores con credenciales del propietario y texto sintético, sin pasar por Render ni utilizar datos del diario: chat Groq correcto, voz Gemini correcta (WAV válido de 103708 bytes), revisión avanzada Gemini rechazada con 429 AI_RATE_LIMIT. No se atribuye ese error a una causa específica no comprobada. La visión y transcripción reales no se ensayaron en esta ronda.

El acceso a Render quedó desbloqueado y el despliegue V2 fue confirmado. No es necesario introducir claves de proveedores en el teléfono: permanecen en Render y fuera de la APK y del ZIP de código. La comprobación de arranque/configuración no equivale a probar todas las funciones desde un teléfono.


## Comprobación pública del servidor

El 22/11/2026 a las 02:19:24 (Europe/Paris), `/health` devolvió HTTP 200 `ok` y `/capabilities` HTTP 200 con API 2.0, ejecución cloud-only, inferencia local desactivada, audio remoto y las ocho rutas Groq/Gemini configuradas. `PRODUCCION-V2.json` registra la evidencia. El arranque completó la inicialización de la base configurada; no se consultaron usuarios ni se crearon cuentas. Esta comprobación no acredita inferencia de todas las rutas ni funcionamiento en un teléfono.
