# Juntos: investigación y entrega V2.2

Revisión de fuentes oficiales, 22 de noviembre de 2026:

- [Hevy: funciones sociales](https://www.hevyapp.com/features/social-features/): relaciones entre compañeros, rutinas compartidas y comparación del entrenamiento. En VERA se conserva una relación privada por invitación y se permite repetir el plan de un reto terminado.
- [Hevy: privacidad](https://help.hevyapp.com/hc/en-us/articles/34461853165079-How-to-keep-my-information-private-Account-Single-Private-Workout-Remove-Social-Media-Features): el alcance de la información compartida debe ser controlable. VERA solo muestra el reto a sus dos participantes; nunca comparte peso, alimentación o conversación.
- [Strava: retos de grupo](https://support.strava.com/en-us/articles/15401736-how-do-group-challenges-work-on-strava): diferencia entre objetivos colectivos y comparación individual. VERA incorpora progreso combinado en la modalidad compartida y resultados individuales en los duelos.
- [Strava: retos](https://support.strava.com/en-us/articles/15401916-strava-challenges): existen objetivos de días activos, además de distancia o tiempo. VERA añade un reto de constancia de siete días.
- [Garmin: gestionar retos](https://support.garmin.com/en-IN/?faq=ha8IW3tdd28jrjqPFXdSTA): aceptación de invitaciones entre contactos. VERA exige aceptación del invitado antes de registrar puntos.
- [Garmin: insignias](https://support.garmin.com/en-GB/?faq=6pECo6UIFn7ergw8kNmfu9): reconocimiento de objetivos cumplidos. VERA muestra una insignia cuando los registros del reto alcanzan el objetivo, sin inventar actividad.

## Funciones implementadas

Tres plantillas: semana activa, objetivo conjunto de series y duelo por series. Calendario semanal, barras por participante, progreso colectivo, historial, recuento de objetivos logrados, ánimos persistentes y repetición de retos. Los resúmenes consideran los últimos 50 retos y lo indican.

El reto semanal cuenta como máximo una sesión declarada por participante y día UTC. Tiene siete días de calendario incluyendo el día de creación, objetivo configurable de uno a siete días y cierre automático del servidor al finalizar. No usa peso ni calorías como competición y no asegura haber verificado una actividad con sensores. Las series de las otras modalidades también son confirmadas por el participante. Ningún botón produce un entrenamiento ficticio en el diario personal.

Las invitaciones son privadas, requieren un nick existente y aceptación. Los reintentos no duplican puntos ni ánimos. La base de datos conserva los resultados y excluye a terceros. Las consultas de listas agrupan los datos en lugar de efectuar tres consultas por cada reto. Refresco cada 12 segundos en la pantalla visible, 60 segundos si está oculta; no consume cuota de IA.

No se han copiado imágenes, diseños ni contenido de otras aplicaciones. No se implementan grupos de más de dos personas, chat público, seguimiento público ni conexión automática con cuentas Hevy/Strava/Garmin.

## Catálogo de ejercicios

876 nombres en español, generados de manera determinista durante el desarrollo a partir de traducciones de movimientos y variantes revisadas. Los nombres comunes tienen traducción directa; las variantes se separan con un punto medio para identificar movimiento, equipo y postura. Se mantienen los identificadores originales y los nombres ingleses como alias de búsqueda. Los músculos mostrados y el nombre guardado en nuevos registros están en español. Las instrucciones originales del conjunto de datos no se presentan en el buscador.

Pruebas: `tests/social22.mjs`, `tests/exercises22.mjs`, `tests/partners.mjs` y la suite de frontend existente. Comprueban privacidad, invitaciones, reintentos simultáneos, cierre semanal, búsqueda bilingüe con resultados en español, persistencia del nombre traducido y prioridad de productos oficiales Zumub sin solicitar NIH para esa coincidencia.
