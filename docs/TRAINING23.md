# Entrenamiento V2.3

## Cambios

- Resumen de series, ejercicios y volumen externo de la fecha elegida, exclusivamente a partir de registros reales.
- Registro compacto: ejercicio, carga y repeticiones visibles; tipo de carga, RIR y notas desplegables.
- Ocho ejercicios recientes únicos, ordenados por fecha y orden del registro. Al pulsar, se recupera la última carga y repeticiones para revisar; nunca se registra actividad automáticamente.
- Registro de días anteriores con validación de fecha y acceso a corregir cada registro.
- Descanso con 60, 90 o 120 segundos, duración editable y comienzo automático opcional al registrar una serie de hoy. Un registro retrospectivo no inicia el descanso.
- Catálogo en español en un panel desplegable, manteniendo la búsqueda existente.
- Actividades importadas de Health Connect visibles como actividad de origen, sin transformarlas en series ni ofrecer una corrección local que se perdería en la siguiente sincronización.
- Escribir un borrador deja de invocar el guardado y la revisión del plan en cada pulsación. La serie terminada sigue pasando por el guardado y sincronización existentes.

El volumen no incluye kg de asistencia ni estima el peso corporal. Una fila con varias series cuenta cada serie. No se añade un cálculo de calorías o duración sin evidencia. Los campos persistentes conservan el contrato existente; no hace falta migración del servidor. Borrador y temporizador utilizan el estado transitorio existente y no son entrenamientos sincronizados.

## Investigación de producto

Revisión de fuentes oficiales, 22 de noviembre de 2026:

- [Hevy: seguimiento de entrenamientos](https://www.hevyapp.com/features/track-workouts/): valores anteriores visibles y registro de series con pocos pasos. Aplicado en accesos recientes y formulario compacto.
- [Hevy: descanso automático](https://www.hevyapp.com/features/workout-rest-timer/): temporizador personalizable tras completar series. Aplicado sin obligar a un intervalo ni registrar automáticamente.
- [Hevy: rutinas](https://www.hevyapp.com/features/gym-routines/): distingue plantilla y entrenamiento completado. Se mantiene esta distinción; no se añaden rutinas persistentes sin un contrato de sincronización específico.
- [Strong: temporizador](https://help.strongapp.io/article/231-rest-timer): control del descanso entre series. Se ofrecen ajustes rápidos y cancelación.
- [Fitbod: detalles del ejercicio](https://help.fitbod.me/hc/en-us/articles/30721437384215-How-to-Navigate-the-Exercise-Details-Screen): detalle de esfuerzo/repeticiones en reserva. RIR sigue siendo opcional, con explicación y validación.
- [Fitbod: pestaña de entrenamiento](https://fitbod.me/blog/a-better-workout-tab/): acciones de registro rápidas durante el entrenamiento. El nuevo diseño reduce la altura inicial sin ocultar el significado de la carga.

## Integración y pruebas

Incluir `training23.js` después de los módulos existentes (incluido `online22.js`); incluir `training23.css` después del tema. El módulo reemplaza las funciones de la serie y envuelve únicamente `areaPage` para Entrenamiento. No modifica el resto de áreas.

Ejecutar `node tests/training23.mjs` y la batería base `node tests/audit-frontend-unit.mjs`. Se comprueban cargas por lado históricas, exclusión de asistencia, fechas pasadas/futuras, no registrar al prellenar, múltiples series, temporizador condicionado a hoy, entradas inválidas y escape de HTML. La prueba es de lógica con DOM mínimo; el diseño debe revisarse además en navegador/APK.

Revisión adicional: las fechas usan `day()` local, no el día UTC; cargas negativas y descanso de cero se rechazan; al confirmar se vacían las repeticiones para impedir que un segundo envío de la pantalla recién renderizada duplique la serie. El temporizador usa una fecha límite absoluta y el estado de la cuenta existente; cerrar sesión recarga la página, sin temporizador capturado de otra cuenta. Las importaciones Health sin `reps` tienen representación específica y no rompen la pantalla.
