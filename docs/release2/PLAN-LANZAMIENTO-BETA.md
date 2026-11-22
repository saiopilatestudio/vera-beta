# Plan de lanzamiento y activación de VERA 2.0 beta

Revisión del 22/11/2026. Durante la revisión, el propietario aprobó ampliar la IA a Groq y Gemini según función, sin modelos locales ni otros proveedores. Los textos siguientes reflejan ese alcance; la integración y el reparto definitivo deben verificarse antes de presentarlos como desplegados. Plan propuesto para el propietario; no representa una campaña ejecutada, un despliegue realizado ni resultados de conversión. Complementa `PRODUCTO-Y-BETA.md`: ese documento define el producto y el guion de uso; éste organiza la preparación, los puntos de abandono y las decisiones de lanzamiento.

## Tres fricciones observadas y cambios propuestos

### 1. El permiso inicial puede pertenecer al invitado, no a la cuenta

**Evidencia de la revisión:** en `www/perf6.js`, el primer diálogo se controla con `vera.notice8`, una marca global. Los botones «Aceptar todo» y «Denegar todo» llaman a `VeraPrivacy6.set`. En `www/privacy6.js`, la preferencia se guarda por cuenta, utilizando `guest` cuando aún no existe una identidad. Con almacenamiento nuevo, aceptar antes de iniciar sesión deja el permiso del invitado; la cuenta que se abre después conserva el análisis remoto denegado, y el diálogo global no reaparece. Una comprobación aislada de las funciones reales en VM reprodujo esa combinación. No se hizo una prueba visual ni en teléfono.

Esto conserva un valor predeterminado prudente, pero contradice la expectativa que genera «Aceptar todo». **No copiar el permiso de guest a una cuenta:** el aislamiento entre cuentas debe conservarse.

**Propuesta para programación:** convertir el primer aviso sin cuenta en información con «Continuar». Pedir una elección independiente cuando exista una cuenta autenticada, o dirigir claramente a Perfil → Privacidad. No marcar el consentimiento de una cuenta por haber visto el aviso global. Una elección previa de otra cuenta no debe reutilizarse.

Texto inicial propuesto:

> Tu diario se guarda en este dispositivo. La IA es opcional y utiliza Groq y Gemini según función, a través del servidor. Después de iniciar sesión podrás decidir si permites enviar consultas, imágenes o audio para analizarlos. Puedes registrar tus actividades sin activar la IA.
>
> **Continuar**

Texto para una cuenta autenticada:

> ¿Permitir el análisis remoto para esta cuenta? Se enviará la consulta y el contexto seleccionado a Groq o Gemini según la función; las fotos o grabaciones sólo cuando pidas analizarlas. Puedes cambiar esta elección en Perfil → Privacidad.
>
> **Permitir análisis remoto** · **Seguir sin IA**

**Aceptación:** instalación nueva → aviso informativo sin permiso; acceso a A → decisión explícita de A; cierre y acceso a B → B no hereda A; denegar permite guardar una serie manual; una consulta de IA denegada no hace POST. Estos textos son propuestas hasta que programación los integre y pruebe.

### 2. Un problema de conexión se presenta como una tarea de administración

**Evidencia:** `VeraPrivacy6.ensureRemote` muestra el mismo texto de actualización del servidor cuando falla la conexión a `/capabilities`, la respuesta no es válida, el contrato es antiguo o falta configuración. Esta observación corresponde a la fuente anterior a incorporar Gemini; el mismo problema de redacción debe evitarse en el contrato ampliado. El mensaje bloquea correctamente el envío de contenido, pero un probador no puede actualizar Render ni aportar las claves privadas del propietario. Reinstalar la APK tampoco resuelve esa configuración.

**Propuesta para programación:** conservar el bloqueo antes del POST y distinguir lo que se conoce de lo que no se ha podido comprobar. No mostrar claves, tokens ni contenido de la respuesta del proveedor. El estado «configurado» no equivale a una llamada real satisfactoria.

| Condición comprobable | Texto propuesto | Siguiente acción |
|---|---|---|
| No se pudo consultar capacidades por red, timeout o respuesta no interpretable | «No hemos podido comprobar el servicio de IA. Revisa tu conexión e inténtalo de nuevo. No se han enviado tus datos para análisis.» | Reintentar o continuar con el registro manual |
| El servidor responde pero no declara contrato V2 de los proveedores autorizados | «El servidor necesita actualizarse para usar Groq y Gemini según función. El propietario de esta beta debe revisarlo. Puedes seguir con tu diario manual.» | Comunicar el mensaje al propietario; no reinstalar |
| Contrato correcto y proveedor de esta función sin configurar | «La IA de esta función aún no está activada en el servidor de esta beta. El propietario debe completar la configuración. No se han enviado tus datos para análisis.» | Continuar sin IA o esperar la activación |

**Aceptación:** las tres situaciones conservan cero POST de contenido; un servidor antiguo nunca habilita un proveedor no autorizado; al estar disponible el proveedor asignado y existir permiso, la consulta sigue el flujo normal. Son mejoras de mensajes, no una pantalla de diagnóstico ya implementada.

### 3. La reinstalación puede confundirse con una actualización ordinaria

**Evidencia:** V2 conserva el identificador de paquete pero utiliza una firma nueva. La APK anterior ya permite exportar respaldo; el manual explica que debe guardarse fuera de la aplicación. La sincronización manual no equivale a esa copia completa del estado. Por tanto, el enlace a la APK no debe circular aislado de las instrucciones.

**Propuesta de distribución:** presentar primero el aviso de migración y después el enlace al ZIP 1. El ZIP 2 es para el propietario/desarrollador y contiene la copia privada de firma: no anunciarlo como parte necesaria de la instalación ni publicarlo junto al enlace de prueba.

Texto previo al enlace:

> **¿Ya utilizas VERA?** Antes de instalar esta beta, exporta tu respaldo desde Perfil y guarda una copia fuera de la app. La firma de V2 es nueva y requiere reinstalación. Lee las páginas de copia y restauración del manual antes de desinstalar.
>
> **Descargar APK y manual**

Para una persona nueva: instalar → iniciar sesión → Empezar entrenamiento → guardar una serie ficticia → comprobar el diario. La primera acción útil no necesita completar todos los datos de perfil ni activar la IA remota. La consulta con IA es un recorrido opcional posterior.

## Organización del equipo para una ronda de beta

Las siguientes responsabilidades son una propuesta operativa; no implican personal contratado ni acceso de terceros a datos.

| Especialidad | Responsabilidad concreta | Evidencia de salida |
|---|---|---|
| Coordinación de producto | Mantener alcance, incidencias y versión única de la entrega | Lista priorizada y estado de cada problema |
| Android y publicación | Compilar, verificar firma/versión y probar instalación en teléfono | APK, SHA-256 y resultado por dispositivo |
| Backend e IA | Conservar la base actual, comprobar contrato y cada función de Groq/Gemini con datos sintéticos | Registro de configuración e inferencia sin secretos |
| Frontend y experiencia de incorporación | Separar cuenta, permiso, registro y sincronización | Pruebas de sesión y recorrido revisado |
| Entrenamiento y ciencia | Revisar términos, cálculos y límites del asesoramiento | Hallazgos revisables; sin promesas de resultados físicos |
| Diseño y accesibilidad | Comprobar legibilidad, controles y orientación | Casos de contraste, foco y revisión en teléfono |
| Calidad y privacidad | Verificar respaldo, restauración e inexistencia de envíos no autorizados | Casos reproducibles con cuentas y datos de prueba |
| Marketing de producto y comunicación | Mantener mensajes fieles a la versión disponible | Texto aprobado por revisión de funciones, sin publicarlo automáticamente |
| Análisis de activación | Recoger sólo observaciones manuales de la sesión de prueba | Tabla agregada sin identidad ni datos del diario |

## Embudo manual de activación

No se incorpora un SDK de analítica, píxel, identificador publicitario ni envío automático. El moderador puede usar un código aleatorio de sesión en una hoja local. No vincularlo a correo, nombre, token o cuenta. No guardar capturas de salud, conversaciones, fotografías ni archivos de respaldo.

| Etapa | Hecho observable | Si no se completa |
|---|---|---|
| Comprensión | La persona explica que V2 requiere copia previa si migra | Revisar texto de distribución antes de continuar |
| Preparación | Copia guardada fuera de la app o instalación nueva declarada | No pedir desinstalación de una versión con datos sin copia |
| Acceso | Puede abrir una cuenta de prueba válida | Separar error del servicio, credenciales y comprensión de la pantalla |
| Primera utilidad | Guarda y vuelve a encontrar una serie ficticia | Registrar el control o mensaje que causó la confusión |
| Control de datos | Distingue guardar, exportar y sincronizar | Ajustar los términos y repetir con otro caso ficticio |
| IA opcional | Entiende permiso, conexión y disponibilidad; la llamada real se anota aparte | No contar un bloqueo correcto como uso real del proveedor asignado |
| Segundo uso de prueba | En una sesión posterior, recupera la serie ficticia sin ayuda | Registrar problema de acceso o recuperación, no inferir abandono comercial |

Medir simplemente: etapa completada sin ayuda / con ayuda / no completada / no evaluada; tiempo aproximado; texto o control confuso. No calcular «retención», demanda o causalidad a partir de unas pocas sesiones moderadas. Un denominador debe incluir sólo las sesiones que pudieron intentar esa etapa; un backend no desplegado es un bloqueo de entorno, no desinterés del usuario.

## Experimento de comunicación sin campaña ni rastreadores

**Hipótesis:** separar «primera serie manual» de «activar IA opcional» hará más comprensible el inicio. No se afirma que ya mejore la conversión.

Preparar dos tarjetas de instrucciones, sin cambiar la aplicación ni pedir permisos diferentes:

- A: «Inicia sesión y registra tu primera serie. Después puedes activar el análisis remoto desde Privacidad si quieres hacer consultas.»
- B: «Primero guarda una serie manual; no necesitas IA. Para consultar a Vera, permite el análisis de esta cuenta en Perfil → Privacidad cuando el servicio de IA esté preparado.»

En una ronda moderada que el propietario organice voluntariamente, alternar qué tarjeta se muestra primero entre personas distintas. Usar cuentas y series ficticias. Observar si encuentran Guardar serie y si comprenden que activar IA es opcional. La intervención del moderador se anota; no mezclar una sesión guiada con una no guiada. Recoger una explicación del participante, no contenido de su diario.

Elegir la redacción más clara a partir de las confusiones observadas; una ronda pequeña orienta correcciones, no demuestra superioridad estadística. No hay envíos, invitaciones, compras publicitarias ni publicaciones realizados como parte de esta entrega.

## Decisiones de salida recomendadas

Estas condiciones organizan la distribución abierta posterior. No impiden entregar una APK candidata claramente identificada para pruebas controladas.

**Lista para revisión técnica:** versión y firma comprobadas, fuente identificada, APK sin modelos locales, manual coherente y secretos fuera del código. Cada cambio posterior en assets exige reconstruir y verificar la APK.

**Lista para prueba moderada en teléfono:** instalación y apertura comprobadas en el dispositivo de prueba; cuenta y datos sintéticos preparados; copia/restauración ensayada en un estado prescindible. La fase de IA sólo se marca lista después de comprobar cada función y su proveedor asignado en el backend V2: texto, imagen y audio. Anotar el proveedor esperado y observado sin secretos; no asumir que probar uno valida el otro.

**No ampliar distribución todavía** si aparece pérdida de datos, mezcla de cuentas, envío pese a denegación, firma inesperada, imposibilidad de recuperar el respaldo de prueba o una promesa comercial que no corresponde al comportamiento disponible. Un error cosmético se registra y prioriza según su efecto; no equivale por sí solo a pérdida de datos.

**Estado conocido de esta entrega al redactar:** pruebas de código y compilación disponibles; no hay evidencia de instalación, cámara, biometría o Health Connect en un teléfono real ni de inferencia real con claves de Groq o Gemini. No anunciar «probado en tu móvil», «precisión validada» ni «servidor ya actualizado».

## Base de la revisión

Inspección de `www/perf6.js`, `www/privacy6.js`, `www/index.html`, `www/session13.js`, las notas frontend y las guías de la entrega. La reproducción de la elección previa a la cuenta usó las funciones reales de privacidad en una VM aislada. No se estudió demanda de mercado, no se compararon precios ni competidores y no se accedió a cuentas reales.

## Estado de esta entrega

Se integraron el aviso inicial informativo, la elección de consentimiento por cuenta y la distinción entre error de conexión y configuración. El manual y el inicio rápido explican el respaldo antes de reinstalar; no se publicó una página de descarga ni se realizó una campaña. La prueba moderada y las métricas propuestas quedan pendientes, sin datos de participantes inventados.
