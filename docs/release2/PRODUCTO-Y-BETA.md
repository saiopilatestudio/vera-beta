# VERA 2.0 beta: producto, presentación y prueba de uso

Documento de producto del 22/11/2026. Describe la fuente V2 de esta entrega; no certifica un despliegue en producción, una prueba con proveedores reales ni resultados de salud. Complementa el manual PDF, `CONFIGURACION-SERVIDOR.md` y `COMPILACION-ANDROID.md`.

## Propuesta de valor que la beta puede sostener

VERA reúne en Android el registro de entrenamiento, alimentación y descanso, el historial personal y consultas de IA mediante Groq y Gemini según la función. El usuario revisa las estimaciones y confirma lo que guarda. El diario conserva datos en el dispositivo y permite sincronización manual de los registros admitidos; no debe presentarse como una copia automática completa de toda la cuenta.

La idea de producto a validar es sencilla: **registrar lo que haces, encontrarlo después y consultar una ayuda contextual sin perder el control de tus datos**. Es una hipótesis de utilidad, no un beneficio demostrado por esta auditoría.

El público inicial propuesto son personas adultas que ya entrenan y quieren un diario común para varias actividades, dispuestas a probar una beta y corregir sus registros. La selección de este público es una decisión de alcance para la prueba; no procede de un estudio de mercado ni acredita demanda. No posicionar esta edición como herramienta de diagnóstico, prescripción clínica, medición corporal por imagen o sustitución de profesionales.

## Qué se puede mostrar y con qué límites

| Función presente en la fuente | Demostración honesta | Límite que debe acompañarla |
|---|---|---|
| Registro de series, carga total o por lado, repeticiones y RIR | Guardar una serie sintética y recuperarla en el diario | El registro no certifica la ejecución ni calcula una mejora deportiva demostrada |
| Sueño y siestas | Introducir horas y revisar la duración calculada | No es diagnóstico del sueño; las valoraciones son entradas del usuario |
| Alimentación y suplementos | Registrar datos manuales o revisar una estimación visual | Una cifra desconocida permanece sin dato; identificación y composición requieren revisión |
| Conversación, imágenes y dictado | Solicitar la función y revisar el resultado del proveedor indicado | Requiere conexión, sesión, consentimiento y backend V2 configurado; no hay IA sin conexión |
| Diario y sincronización manual | Distinguir un registro local de una sincronización confirmada | No sincroniza integralmente perfil, fotos, conversación ni memoria |
| Respaldo JSON | Exportar y restaurar el estado en una cuenta de prueba | No incluye fotos originales ni credenciales; importar reemplaza el estado local |
| Retos de dos participantes | Explicar el flujo por nick con dos cuentas de prueba | No venderlo como grupos ilimitados o sistema completo de puntuación deportiva |

## Novedades verificadas en código y pruebas

- IA exclusivamente mediante Groq y Gemini: retirados pesos, motores y restauradores de modelos locales, OCR local y rutas de voz nativa. Los catálogos estáticos y el lector QR se conservan.
- Comprobación de capacidades del servidor antes de enviar contenido para IA. Un servidor antiguo, una ruta no admitida o el proveedor de esa función sin configurar produce un bloqueo explícito. Cada función comprueba su propia disponibilidad.
- Aislamiento de fotos y grabaciones cuando cambia la cuenta durante una operación; las pruebas diferidas verifican que no se envían como contenido de la cuenta siguiente.
- Correcciones de validación y conservación de datos: carga por lado, duración del sueño, nutrientes desconocidos, contexto limitado de conversación y respuestas de sesiones antiguas.
- Versión visible 2.0 beta y build 200; firma nueva para esta entrega. No confundir esta firma con una actualización directa sobre versiones anteriores.

La evidencia automatizada se detalla en el informe final: lógica frontend, pruebas de API con bases temporales, comprobaciones de ausencia de modelos y compilación de Java contra Android API 35. No permite afirmar que la interfaz ya se haya validado visualmente en teléfonos ni que se haya medido la precisión real de Groq o Gemini.

## Texto breve de presentación

> VERA 2.0 beta reúne tu registro de entrenamiento, alimentación y descanso en Android. Revisa tu diario, conserva una copia y solicita ayuda a una IA que utiliza Groq o Gemini según lo que solicites. Tú revisas las estimaciones y decides cuándo sincronizar. Es una versión de pruebas: la IA requiere conexión y un servidor configurado.

Para acompañar el enlace de instalación:

> Si ya usas VERA, exporta primero tu respaldo y guárdalo fuera de la app. Esta beta tiene una firma nueva y requiere reinstalación. El manual explica cómo conservar y restaurar tus datos.

Para invitar a probarla, sin prometer un servicio ya desplegado:

> Buscamos comprobar si registrar y recuperar tus datos resulta claro. La prueba dura unos diez minutos después de instalar e iniciar sesión. Usaremos datos ficticios. Si la IA todavía no está activada en el servidor, comprobaremos el mensaje de disponibilidad y dejaremos su uso real pendiente.

## Guion de prueba de diez minutos

Preparación fuera del cronómetro: APK instalada en un teléfono de prueba, cuenta de prueba válida y manual disponible. Si existe una instalación anterior con datos reales, completar su respaldo antes de cualquier cambio. No realizar esta prueba de restauración sobre el diario real del participante. El moderador no pide contraseñas, claves API, fotos personales ni datos de salud.

| Tiempo | Tarea con datos ficticios | Qué observar |
|---|---|---|
| 0:00-1:00 | Localizar Perfil y Privacidad; explicar con sus palabras cuándo se envían datos a Groq o Gemini | Si distingue guardar en el dispositivo, sincronizar y solicitar IA |
| 1:00-3:00 | En Entrenar, registrar una serie de ejemplo: 10 kg por lado, 8 repeticiones, RIR 2 | Si entiende el total de 20 kg, encuentra Guardar y recupera la serie |
| 3:00-4:00 | Registrar una noche ficticia de 23:00 a 07:00, sin valoraciones opcionales | Si interpreta la duración de ocho horas y reconoce que los datos son manuales |
| 4:00-5:00 | Abrir el registro manual de una comida; dejar un nutriente desconocido sin rellenar | Si distingue ausencia de dato de un cero conocido |
| 5:00-7:00 | Con Groq disponible y consentimiento, preguntar por el registro ficticio. Si no está disponible, leer el bloqueo y explicar qué falta | Si entiende la respuesta o el error. No marcar una prueba de IA real como superada cuando sólo se mostró el bloqueo |
| 7:00-9:00 | Exportar un respaldo del diario ficticio, localizar el archivo y sincronizar los registros de prueba si el servidor está operativo | Si encuentra la copia y distingue exportación de sincronización. La restauración se ensaya después, sólo en un estado de prueba prescindible |
| 9:00-10:00 | Pedir que indique una acción clara, una confusa y qué esperaba que ocurriera | Recoger frases sobre la interfaz, sin copiar contenido personal del diario |

Extensiones separadas del guion: foto de un objeto de prueba, dictado de una frase neutra, restauración de respaldo sintético, permisos de cámara y micrófono, accesibilidad, biometría, Health Connect y repetición en otro tamaño de pantalla. Requieren tiempo y evidencia propios; no declararlas verificadas por completar los diez minutos.

## Medición manual sin añadir telemetría

Esta entrega no añade analítica automática para medir la prueba. El propietario puede anotar una fila por sesión con un código aleatorio no vinculado a una cuenta. No registrar nombres, correos, tokens, contenido de chat, imágenes, diagnósticos, cargas reales ni hábitos de sueño.

| Medida manual | Cómo anotarla | Cómo interpretarla |
|---|---|---|
| Finalización por tarea | Hecha sin ayuda / con ayuda / no terminada / no evaluada | Separar los bloqueos de entorno de los fallos de comprensión |
| Tiempo aproximado | Segundos por tarea, sin grabación de pantalla | Detectar qué paso concentra la demora; no comparar rendimiento deportivo |
| Ayuda necesaria | Número de indicaciones del moderador y nombre del control confuso | Priorizar cambios de texto o navegación concretos |
| Comprensión de guardado | Sí/no explica la diferencia entre local, sincronización y respaldo | Una respuesta incorrecta obliga a revisar el lenguaje del producto |
| Error observado | Código o frase genérica y paso reproducible, con datos ficticios | Registrar el fallo técnico sin adjuntar contenido personal |
| Claridad percibida | Una valoración voluntaria de 1 a 5 y un comentario sobre la interfaz | Señal cualitativa; una muestra pequeña no acredita satisfacción general |

No establecer objetivos de conversión, retención, precisión o reducción de tiempo como resultados ya logrados. Una primera ronda pequeña sirve para encontrar problemas de uso, no para calcular demanda ni anunciar porcentajes comerciales. Al terminar, conservar sólo las notas necesarias para corregir los problemas, sin enlazarlas con la cuenta utilizada.

## Decisiones de producto para después de la beta

Estas oportunidades quedan fuera de las funciones completadas de V2. No se anuncian como disponibles:

1. Validar en teléfono la instalación, el respaldo y la recuperación antes de ampliar la distribución.
2. Comprobar ambos proveedores con muestras sintéticas de sus funciones asignadas, registrando errores y necesidad de corrección; todavía no hay una evaluación real de precisión.
3. Probar la comprensión de sincronización y cobertura del contexto antes de prometer continuidad entre dispositivos.
4. Revisar terminología y traducción del catálogo de ejercicios a partir de tareas observadas.
5. Evaluar si hacen falta retos más amplios y comprobar la calidad de la voz española de Gemini. No añadir otros proveedores ni motores locales.

## Base de esta revisión

La propuesta se deriva de los archivos de la entrega: `README.md`, `www/index.html`, `www/session13.js`, `www/privacy6.js`, `ai-provider.mjs`, las pruebas en `tests/` y las guías de `docs/release2/`. Las capacidades y el alcance del respaldo se contrastaron con las notas de verificación frontend. No se realizó investigación nueva de mercado, no se fijaron precios y no se publicaron mensajes ni se contactó con terceros.

## Reparto de IA de esta entrega

El chat habitual y el dictado usan Groq. Las fotos, etiquetas, revisión avanzada elegida expresamente y lectura de respuestas usan Gemini. Una ruta sin configurar devuelve un error claro; no hay sustitución automática de proveedor. La capacidad de los modelos no implica que VERA ya incluya vídeo, PDF, generación de imágenes o todas sus herramientas.

El consentimiento se renueva por cuenta al añadir Gemini. El aviso inicial es informativo: no concede el permiso de una cuenta futura. Los resultados deportivos, la precisión de imágenes y la calidad de voz siguen necesitando evaluación real.

