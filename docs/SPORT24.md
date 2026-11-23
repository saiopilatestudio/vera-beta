# Multideporte VERA — GPS y natación

## Flujo implementado

Desde Cardio se inicia ciclismo urbano, carrera o paseo con GPS. Entrenar incluye un acceso directo. Android solicita ubicación precisa al pulsar Iniciar; tras autorizarla se vuelve a pulsar el botón. En Android 13+ se solicita también mostrar notificaciones. El servicio de ubicación en primer plano continúa al bloquear la pantalla, con aviso de actividad en curso. No se solicita ubicación permanente ni se inicia desde segundo plano o tras reiniciar el teléfono.

Se muestran tiempo activo, distancia, velocidad media y ritmo por km. Pausar excluye el tiempo posterior y reinicia el punto de referencia GPS: al reanudar no une posiciones de ambos tramos. Marcar parcial añade tiempo/distancia del tramo; finalizar añade el último tramo pendiente. Se admite hasta 200 parciales y la captura termina a las 24 horas. El GPS rechaza señales imprecisas (>35 m), obsoletas (>15 s), fuera de orden, saltos de velocidad y ruido pequeño. Un intervalo de más de 30 s reinicia el punto de referencia sin inventar distancia. La distancia es estimada; la sesión no garantiza precisión de un dispositivo deportivo.

La natación se registra manualmente, indicando piscina o aguas abiertas, metros, fecha/hora, duración y marcas opcionales. Cada marca usa «metros | min:seg»; se calcula ritmo por 100 m. Los parciales no pueden exceder la distancia o el tiempo total. También se pueden registrar ciclismo, carrera y paseo manualmente.

Finalizar GPS sólo prepara el resumen. Guardar crea un registro Cardio con identificador estable; el borrador nativo se borra únicamente cuando el servidor confirma esa fila. Si falla la conexión, Comprobar guardado reintenta sin crear otra actividad. Una respuesta de otra cuenta se descarta. La app no afirma que el registro esté guardado antes de confirmarlo.

## Privacidad y límites

Sólo se conserva el último punto GPS en memoria para calcular distancia; no se almacena ni envía ningún recorrido, latitud o longitud. El almacenamiento privado de Android conserva el resumen agregado y la cuenta propietaria, sin token. El cierre de sesión pausa la captura. Otra cuenta no recibe el resumen y debe volver a la cuenta propietaria para resolver la sesión pendiente.

Android puede detener el proceso por intervención del usuario o por restricciones del fabricante. Al abrir de nuevo, la sesión aparece pausada/interrumpida con el último resumen guardado; no se atribuye actividad al tiempo que no se pudo medir. El servicio no promete resistencia a un cierre forzoso. La grabación GPS iniciada puede continuar sin red, pero el guardado en la cuenta necesita servidor y nunca se presenta como confirmado sin respuesta.

## Contrato

Registro Cardio: id, sport cycling/running/walking/swimming, durationSeconds, distanceMeters, avgSpeedKmh, paceSecondsPerKm, start/end epoch ms, date local del inicio, value minutos, source gps/manual, laps [{distanceMeters,durationSeconds}]. Natación añade swimmingMode pool/open_water y paceSecondsPer100m. No incluye coordenadas. Health Connect reutiliza estos campos; los registros importados mantienen su procedencia para evitar sumar indiscriminadamente duplicados.

## Verificación realizada

- Compilación de todas las clases Java contra Android API 35 (sin APK release ni despliegue).
- SportMathTest24: distancia geodésica, precisión, antigüedad/orden, saltos, límites por deporte, ruido y reinicio de referencia en pausa/intervalo largo.
- tests/sport24-integration.mjs: generadores reales de Cardio y Entrenar con acceso GPS y selector de natación.
- tests/sport24-frontend.mjs: ritmo de natación, parciales, entrada inválida, reintento con ID estable, confirmación específica del servidor, conservación del borrador GPS, aislamiento de cuenta y puerta Google/Health.
- Falta prueba en un móvil físico: recorrido real, pantalla bloqueada, pérdida de señal y políticas de batería del fabricante. La compilación y los tests de lógica no sustituyen esa comprobación.

## Fuentes oficiales

https://developer.android.com/develop/background-work/services/fgs/service-types#location
https://developer.android.com/develop/background-work/services/fgs/launch
https://developer.android.com/develop/sensors-and-location/location/permissions/runtime

Estas fuentes fundamentan el tipo FGS location, sus permisos, inicio desde la actividad visible y solicitud conjunta de ubicación aproximada/precisa. No se utiliza una API de mapas ni se factura un servicio de rutas.

## Revisión visual 320/360 px

Chrome headless real con Playwright, datos ficticios y red externa bloqueada: Cardio, formulario manual de natación abierto, GPS activo con parciales ficticios, Entrenar con petición larga y fallo simulado. En todos los casos document.scrollWidth coincide exactamente con viewport (320/320 y 360/360), sin elementos que excedan el borde ni errores JavaScript en las pantallas iniciales. Se corrigió el recorte interno de fecha/hora del formulario de natación usando una columna en pantallas pequeñas. Petición de entrenamiento conservada tras render y error; borradores separados por semana y aislados por cuenta. Evidencia local en work/v243-validation (fuera de la distribución).

## Datos importados incompletos

Las métricas ausentes (null, undefined, NaN o texto vacío) se muestran como «Sin dato», manteniendo los ceros medidos. La velocidad y el ritmo sólo se calculan cuando existen distancia y tiempo válidos; con distancia cero el ritmo no es calculable. Se indica Google Fit · Health Connect cuando la procedencia coincide con Google Fit, Health Connect en las demás importaciones, y se muestra energía registrada si existe (también cero). El minigráfico utiliza exclusivamente parciales reales con tiempo y distancia conocidos, al menos dos; presenta los últimos doce si hay más, sin interpolar rutas ni inventar marcas. Pruebas específicas y captura Fit-sin-distancia-320.png verifican un registro ficticio con duración y energía pero sin distancia; ningún cero de distancia o velocidad se inventa.
