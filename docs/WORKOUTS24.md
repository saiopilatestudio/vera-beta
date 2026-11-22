# VERA V2.4 - tablas semanales adaptadas

## Investigación de producto

Fuentes oficiales consultadas el 22 de noviembre de 2026. Se compararon planificación, historial, adaptación diaria, material, esfuerzo y separación entre propuesta y actividad realizada. No se replican algoritmos propietarios ni se afirma afiliación.

| Fuente | Hallazgo | Aplicación en Vera |
|---|---|---|
| [Fitbod: series, repeticiones y peso](https://help.fitbod.me/hc/en-us/articles/43489869175063-How-does-Fitbod-decide-my-sets-reps-and-weight) | El historial y esfuerzo influyen en recomendaciones; la siguiente sesión no siempre sube intensidad. | Contexto confirmado con última referencia por ejercicio y progresión semanal. RIR objetivo y explicación; sin cargas inventadas. |
| [Freeletics: Adapt Today](https://www.freeletics.com/en/blog/posts/quick-adapt/) | La sesión se adapta a tiempo, material, espacio y preferencias actuales, confirmando el cambio. | Petición escrita para adaptar semana; confirmación antes de sustituir una tabla explícitamente. Se conserva la petición para actualizaciones automáticas. |
| [Freeletics: adaptación de sesión](https://help.freeletics.com/hc/en-us/articles/360003933780-Adapt-your-Bodyweight-training-session) | Se puede reducir o retirar material en el día concreto. | La petición puede reducir material. El catálogo ofrecido a la IA sólo contiene material confirmado y peso corporal. |
| [Hevy: valores anteriores](https://www.hevyapp.com/features/track-exercises/) | El historial visible ayuda a preparar el siguiente registro sin perder la referencia. | Última carga/repeticiones comprobadas junto a cada ejercicio; abrirlo sólo prepara un borrador. |
| [Hevy: registro de entrenamiento](https://www.hevyapp.com/features/track-workouts/) | Distingue rutinas, sesión en curso y series completadas. | La tabla vive en una tabla de servidor separada del diario. Ninguna sesión propuesta crea registros de actividad. |
| [Alpha Progression: generador](https://alphaprogression.com/en/blog/alpha-progression-workout-plan-generator) | Objetivo, nivel, tiempo, frecuencia y material forman una tabla estructurada de ejercicios, series y repeticiones. | Siete fechas, días de entrenamiento/recuperación y ejercicios canónicos en español con series, rango de repeticiones, RIR, descanso y técnica. |
| [Alpha Progression: progresión](https://alphaprogression.com/en/glossary/progression-recommendations) | Una recomendación es editable y necesita historial; no presupone mejora continua. | Sin historial se genera una primera tabla conservadora y la carga queda vacía. La referencia anterior no se presenta como carga obligatoria. |

## Funciones implementadas

- Primera tabla automática tras guardar un perfil completo y permitir IA, sin exigir tres registros previos.
- Selector de semana actual y siguiente, aislado por cuenta. En domingo se abre por defecto la siguiente semana para ofrecer sesiones próximas utilizables.
- Una llamada estructurada a Groq para generar una tabla. No se realizan cuatro llamadas de especialistas por consulta.
- Actualización por cambios relevantes con tres minutos de inactividad, evitando generar por cada serie; botón de finalizar sesión para actualizar al terminar. Sin bloqueo de 24 horas.
- Adaptación explícita por petición, conservada en el servidor para que una actualización automática no olvide la intención del usuario.
- Tablas persistidas por cuenta y semana. Caché por contexto relevante y petición; las coincidencias no consumen generación/cuota.
- Histórico confirmado de seis semanas, últimas referencias de hasta doce ejercicios, hasta ocho registros recientes de recuperación/cardio/peso, resumen semanal de series y volumen. Cobertura y omisiones visibles. Máximo 12 KB UTF-8 de contexto; hasta 36 candidatos equilibrados con prioridad a movimientos habituales y material disponible.
- Catálogo español de la aplicación: el modelo devuelve IDs conocidos; el servidor obtiene el nombre canónico, no confía en nombres inventados o ingleses del modelo.
- Tablas de siete fechas, validación de series, repeticiones, descanso, RIR, días disponibles, material/IDs admitidos y exclusión de cargas numéricas inventadas.
- Ejercicios estáticos/isométricos excluidos del generador por repeticiones. La prueba real inicial devolvió una plancha con segundos en `reps`; se corrigió la selección y el prompt sin convertir falsamente segundos en repeticiones ni ampliar límites. Indicaciones técnicas básicas de movimientos comunes sustituidas por textos conservadores revisados, en lugar de aceptar afirmaciones biomecánicas arbitrarias del proveedor.
- Referencias de carga sólo desde registros confirmados. Normalización de kg por lado y asistencia. El formulario abierto mantiene repeticiones y RIR reales vacíos; no registra actividad automáticamente.
- Persistencia del plan anterior si la IA falla, el formato es inválido o los datos cambian durante la generación. Peticiones simultáneas iguales comparten una llamada; diferentes se rechazan con 409 mientras se está generando.
- Respuestas tardías de otra cuenta o tras revocar IA no se incorporan al estado visual. La generación exige confirmar antes los envíos de diario pendientes.

## Contrato de integración

`weeklyWorkout24(uid, input, {db, ask, beforeGenerate})` en `workouts24.mjs`.

POST `/workouts/weekly`:

```json
{"week":"2026-11-23","request":"Esta semana sólo dispongo de 30 minutos","readOnly":false}
```

`request` es opcional (se conserva el anterior), hasta 1500 caracteres. `readOnly:true` recupera el plan confirmado sin generar ni reservar cuota; no necesita permiso de IA. Respuesta: `{plan, request, cached, stale, inputSignature}`. `plan:null` significa que aún no existe tabla.

El servidor integra autenticación, cuenta Google obligatoria, enrutamiento `coach`, permisos y cuotas. `beforeGenerate` se ejecuta únicamente en cache miss, antes de la llamada al proveedor. El módulo usa `account_state` y `diary_sync` del UID autenticado, no acepta un perfil cliente como autoridad. Tabla propia `workout_weeks24`; no modifica `weeklyPlan21` ni requiere ampliación de profile-sync.

Frontend: incluir `www/workouts24.js` después de `training23.js`, `planning21.js` y los módulos online. CSS después del tema. Integra Entrenar y Equipo; sustituye los disparadores del plan antiguo, conservando su estado histórico. `requestWorkout24(text)` permite abrir el flujo desde una petición conversacional explícita.

## Pruebas y límites

`tests/workouts24.mjs`: base SQLite real aislada, primera tabla sin historial, aislamiento UID, caché/petición, reserva sólo en miss, material, formato inválido, carga histórica por lado, conflicto por cambios durante IA y concurrencia.

`tests/workouts24-frontend.mjs`: generación inicial, borrador utilizable sin series fantasma, espera tras actividad, cuenta cambiada y consentimiento revocado. Pruebas VM con DOM mínimo, no móvil físico.

La selección de ejercicios y ajuste de tiempo dependen de la respuesta del proveedor; no se garantiza una prescripción clínica ni una simulación de recuperación muscular. El prompt exige aclaración sin ejercicios ante dolor/lesión activa o restricciones incompatibles; `needs_review` impide incluir sesiones. No se generan tratamientos o rehabilitación. Las cuotas gratuitas permanecen. No hay fallback de IA local ni tablas simuladas presentadas como resultado remoto.

Integración comprobada: HTTP y SQLite reales con transporte controlado, más una llamada real Groq con perfil ficticio: siete días, tres sesiones y quince ejercicios en 5,123 segundos; repetición desde caché sin otra llamada. La respuesta usa JSON Schema estricto con IDs permitidos. Consultar VERIFICACION.txt de la entrega para firma, despliegue y comprobaciones visuales.
