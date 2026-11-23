# Ejercicios: catálogo, variantes y referencias web (2.4.5)

La selección semanal consulta los 876 ejercicios existentes por su nombre español, nombre original e identificador. Una coincidencia ambigua ofrece variantes; elegir una guarda el ID, no una traducción aproximada. La lista enviada a la IA conserva los ejercicios seleccionados y los indicados en la petición antes de completar con opciones habituales. Sigue limitada a 36 candidatos y al material y nivel confirmados.

La petición «Para el lunes incluye press declinado con mancuernas, aperturas en máquina y extensión de tríceps en polea con barra» exige las variantes correspondientes. El material se interpreta dentro de cada frase; la barra del tríceps no convierte el press con mancuernas en press con barra. Las menciones negativas, históricas o condicionales no se convierten en requisitos. Cuando la expresión no es inequívoca, la selección explícita en el catálogo permite concretarla.

El catálogo no cubre todos los nombres posibles ni todos los ejercicios existentes. El usuario puede confirmar un ejercicio propio indicando nombre, material y que se mide por repeticiones. La ficha no inventa cargas, series, repeticiones, músculos ni credenciales técnicas. Las propuestas posteriores siguen sujetas a revisión y a las validaciones de la tabla. No admite convertir posiciones mantenidas o estiramientos en repeticiones.

## Contrato

`POST /exercises/search` requiere cuenta autorizada y recibe `{query,source,week}`. `query` tiene 2–100 caracteres, `source` es `catalog` o `web`, y `week` identifica un lunes válido.

- Catálogo: `{source:'catalog',status:'matched'|'ambiguous'|'unknown',results:[{id,title,name,equipment,level,muscles}],availableEquipment:[...]}`. Sólo devuelve candidatos compatibles con el perfil.
- Web: `{source:'Wikipedia (es)',status:'references'|'unknown',results:[{title,url,source}],availableEquipment:[...]}`. El servidor consulta únicamente la API fija de Wikipedia en español. Envía el nombre buscado, no el perfil, diario, identificador ni token de cuenta. Las URLs de resultado se construyen con IDs de página numéricos de esa fuente.
- Web no disponible: `503 EXERCISE_SEARCH_UNAVAILABLE`. El catálogo y la entrada manual siguen disponibles. Hay límite de consultas, timeout, respuesta acotada y caché de referencias; no se consume cuota de IA.

Elegir una referencia web sólo prepara el formulario: el usuario debe confirmar nombre y material. Una referencia no certifica técnica, seguridad, idoneidad personal ni exactitud; puede ser un artículo relacionado. No se descarga ni ejecuta contenido de las páginas enlazadas.

`POST /workouts/weekly` admite `exerciseIds:[ID]` y `customExercises:[{name,equipment,measurement:'repetitions'}]`, hasta 12 de cada clase. La identidad personalizada es estable y calculada por el servidor. Los campos quedan persistidos en la propuesta; omitirlos en una edición posterior conserva la selección anterior. Una lista vacía la retira. No se registran entrenamientos realizados por seleccionar o generar una propuesta.

## Comprobaciones

- Prueba de resolución de los 876 nombres españoles y los 876 IDs originales, además de ambigüedad y ausencia.
- Petición literal con tres materiales y regresiones independientes barra recta/barra V.
- Identidades personalizadas estables, ausencia de dosis y rechazo de material no disponible o unidades incompatibles.
- HTTP local real con autenticación, perfil y SQLite; Wikipedia controlada para probar errores, formato y aislamiento del contenido enviado.
- Consulta pública real «Sentadilla» el 23/11/2026: devolvió referencias, incluida la ficha [Sentadilla](https://es.wikipedia.org/?curid=816191). La disponibilidad futura depende de Wikipedia; no es una prueba de la pertinencia de todos los posibles términos.

La búsqueda usa el contrato documentado en [MediaWiki API:Search](https://www.mediawiki.org/wiki/API:Search). No utiliza claves de IA ni proveedores de inferencia adicionales. No se ha publicado ni desplegado esta corrección.
