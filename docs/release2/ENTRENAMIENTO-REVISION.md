# Revisión de entrenamiento de fuerza - VERA 2.0 beta

Fecha: 22/11/2026. Rol: análisis de lógica de entrenamiento. Esta revisión ejecuta funciones reales del cliente y el validador del servidor con datos sintéticos en Node/VM. No representa pruebas en teléfono, validación clínica ni evaluación de respuestas de IA. No realiza llamadas a proveedores. El proveedor remoto permitido puede ser Groq o Gemini; no se propone inferencia local.


## Cierre de la revisión después de la integración

**Estado final: los cinco hallazgos descritos abajo están corregidos en la fuente V2 revisada.** Se ha vuelto a leer la implementación de `session13.js`, `index.html`, `perf6.js` y `state14.js`, y se ha ejecutado personalmente `tests/audit-frontend-unit.mjs`: **31 grupos superados**, incluidos los casos de regresión de entrenamiento. No se detectó una regresión bloqueante dentro de este alcance.

| Hallazgo original | Corrección verificada |
|---|---|
| 1. Edición sólo textual | El editor específico cambia ejercicio, fecha, carga, convención, repeticiones y RIR; mantiene ID, actualiza nota/payload/volumen y marca decisiones afectadas. La entrada inválida no modifica el registro. |
| 2. Convenciones de carga | `validateTraining14` y `trainingLoad14` distinguen total, por lado y asistencia. La carga antigua por lado se interpreta sin duplicar las series rápidas ya normalizadas; asistencia no se suma al volumen externo y sigue contando como series. Inicio y Progreso comparten `trainingVolume14`. |
| 3. Contrato RIR/repeticiones | La ruta de máquinas usa la validación común. RIR11,301 repeticiones y101 series se rechazan antes de guardar; RIR10 y300 repeticiones se aceptan. El RIR vacío permanece ausente. |
| 4. Orden de llegada | Las referencias se buscan en días anteriores con independencia de la posición del registro. No se afirma cronología entre series del mismo día cuando no se conserva una hora. |
| 5. Ventana temporal | `trainingRows14(28)` incluye hoy y hoy-27, excluye hoy-28, mañana y fechas inválidas. «Marcas por sesión» también limita su intervalo superior. |

Las secciones siguientes conservan el diagnóstico original y su reproducción para trazabilidad; sus «cambios propuestos» ya se han integrado dentro del alcance descrito. La prueba diagnóstica anterior en `work/v2-training-tests/probe.mjs` documenta los fallos de la candidata anterior y **no debe usarse como un test de aceptación de la versión corregida**. Las regresiones vigentes están en `tests/audit-frontend-unit.mjs`.

La comprobación sigue siendo de lógica y contratos con datos sintéticos. No acredita una sesión real de entrenamiento, ejecución en un teléfono ni calidad de respuestas remotas de Groq o Gemini.

## Diagnóstico original de la candidata

Se reproducen cinco fallos en la candidata anterior a la revisión de entrenamiento. Los resultados originales quedan en `work/v2-training-tests/resultados.json` y el experimento en `work/v2-training-tests/probe.mjs` del espacio de trabajo. Son pruebas de diagnóstico del comportamiento anterior, no tests que deban seguir pasando después de corregirlo.

### 1. P1 - Corregir una serie sólo cambia su texto

**Ruta real:** Progreso → Historial y correcciones → Corregir.

`editRecord()` ofrece el detalle de un entrenamiento, pero no sus campos estructurados `kg`, `reps`, `rir`, ejercicio o fecha. `applyEdit()` sólo cambia `note` para esta clase de registro. Se reprodujo una serie introducida por error con 300 kg × 10: escribir «Prensa · 30 kg» en la corrección cambia la nota, pero mantiene `kg=300` y el resumen sigue contabilizando 3.000.

**Efecto:** el diario parece corregido mientras las estadísticas, el contexto de IA y la sincronización conservan la cifra incorrecta.

**Cambio propuesto:** editor específico para entrenamiento con ejercicio, fecha, modo de carga, carga, repeticiones y RIR; validar antes de mutar el registro, regenerar la nota coherente y conservar ID/revisión. Reutilizar la validación de las altas y marcar las decisiones afectadas. Comprobar que 300→30 cambia resumen y payload; una corrección inválida debe conservar íntegro el registro anterior.

### 2. P1 - Dos convenciones de carga producen volúmenes incompatibles

**Ruta real:** Entrenar → Mi gimnasio/Máquinas → ficha guardada → Usar en el entrenamiento. `trainMachine()` abre `Registro`, que usa `entry()` y `add()`; no es código inaccesible aunque la pantalla principal tenga otro formulario de series.

El formulario de máquinas permite «Por lado», pero `add()` guarda `kg=30` sin conversión. El formulario rápido, en cambio, convierte 30 kg por lado a `kg=60`. En el experimento, diez repeticiones de la primera ruta aportan 300 al volumen, frente a 600 de la segunda. Ambos resúmenes (`home()` y `strengthSummary()`) también suman una serie de 40 kg de **asistencia** × 10 como 400 de carga externa; aumentar ayuda aumenta el volumen mostrado.

**Cambio propuesto:** una representación compartida de carga y un único agregador, conservando carga introducida y convención. Separar asistencia de carga externa en resúmenes: contar sus series, pero no sumar los kilos de ayuda como kilos levantados. Explicar que el volumen mostrado es carga externa × repeticiones y no incluye peso corporal. El tratamiento de registros antiguos debe respetar su convención y evitar duplicar cargas ya normalizadas; no reescribir datos ambiguos sin revisión. Pruebas: equivalencia entre formularios, ausencia de doble multiplicación, asistencia excluida del volumen externo y datos heredados legibles.

### 3. P2 - El formulario de máquinas guarda valores que el servidor rechaza

La misma ruta histórica ofrece RIR hasta 20. Se ejecutó `add()` con RIR15 y se guardó localmente; el `validateRecord()` real de `journal.mjs` rechazó el mismo registro con 422 porque admite como máximo10. El formulario tampoco comparte el límite de300 repeticiones por serie ni el límite de100 elementos del servidor. Un registro fuera de contrato puede impedir sincronizar el lote completo, cuya validación es atómica.

**Cambio propuesto:** unificar validaciones y límites en formulario rápido, catálogo, máquina y editor. Mostrar el error antes de guardar. Verificar RIR10 aceptado, RIR11 rechazado, serie300 aceptada y301 rechazada. La ausencia opcional de RIR debe mantenerse como ausencia, no convertirse en cero.

### 4. P2 - Las marcas dependen del orden de inserción, no sólo de la fecha

`recordFor()` exige a la vez que un registro previo tenga fecha anterior/igual y que aparezca antes en el array. Al añadir o sincronizar una sesión antigua después de una nueva, la antigua no participa en la comparación de la nueva.

**Reproducción:** array `[21/11: Prensa 50×10, 20/11: Prensa 40×10]`. La sesión del21 devuelve «Primera referencia» en lugar de una mejora de carga a repeticiones comparables. Las funciones reales producen ese resultado.

**Cambio propuesto:** incluir siempre registros de fechas anteriores, aunque se hayan incorporado después. Para registros del mismo día, no inventar una hora; usar un criterio explícito o evitar afirmar una cronología que no se conserva. Mantener la comparación por ejercicio, gimnasio, máquina, recorrido y modo. Probar orden invertido, registro retroactivo y llegada por sincronización.

### 5. P2 - «Últimos 28 días» incluye 29 fechas y registros futuros

`strengthSummary()` empieza en hoy menos28 y usa comparación inclusiva, por lo que incluye29 fechas contando hoy. Tampoco limita el extremo superior a hoy. El experimento con una serie de hoy menos28 y otra del01/01/2099 muestra2 series, cuando ambas deberían quedar fuera de los28 días naturales que terminan hoy. La importación acepta fechas futuras como cadenas y el backend actual no las descarta por ser futuras, de modo que es un borde alcanzable por respaldo/sincronización.

**Cambio propuesto:** intervalo de calendario `[hoy-27, hoy]`, utilizando operaciones de fecha local en vez de restar milisegundos fijos; excluir fechas futuras y entradas inválidas de los resúmenes. Aplicar también el límite superior a «Marcas por sesión». Pruebas de los cuatro bordes: hoy, hoy-27, hoy-28 y mañana.

## Qué sí se verificó como correcto en la candidata

- El formulario rápido convierte explícitamente «Peso por lado ×2» y conserva la carga introducida.
- El cálculo básico carga × suma de repeticiones es correcto cuando la carga ya es total externa y válida.
- Las series guardadas tienen ID al persistir, y el sistema dispone de sincronización con revisión/conflictos.
- El resumen ya avisa de que el volumen no sustituye a intensidad o recuperación; conviene precisar su alcance al excluir asistencia.
- RIR0 del formulario histórico se almacena como cadena «0», que es truthy en JavaScript; su aparición en la nota no se ha identificado como fallo. No se confunde esa observación con la inconsistencia del máximo20.

## Alcance de las propuestas

Son correcciones de datos y trazabilidad, no una prescripción de entrenamiento. No se recomienda aumentar cargas de forma automática ni inferir técnica, esfuerzo real o hipertrofia desde fotografías. La programación y progresión de IA necesitan contexto, revisión de la persona y pruebas de proveedor real separadas. No se ha implementado ni anunciado un sistema nuevo de planificación por el hecho de realizar esta revisión.

