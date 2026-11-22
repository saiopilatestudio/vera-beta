# Sincronización automática de salud - V2.4

## Fallos identificados y correcciones

- `autoHealth=false` podía permanecer en instalaciones antiguas y desactivar la lectura aunque la integración ya era obligatoria. Se deja de usar ese interruptor heredado para bloquear lecturas autorizadas.
- Lecturas forzadas desde foco, retorno y verificación Google sustituían el identificador de una lectura en curso. Sus respuestas se descartaban. Ahora se conserva la lectura activa y se agrupan los disparadores en una única repetición posterior.
- La lectura espera a recuperar la cuenta del servidor y a verificar el vínculo Google. Una sesión bloqueada cancela el ticket pendiente; al revalidarse puede iniciarse una lectura nueva sin esperar dos minutos.
- Los errores nativos por categoría ya no quedan en silencio. `healthImport21(ticket,'error',[{type,message}])` conserva los registros de la categoría fallida; nunca interpreta el error como una instantánea vacía.
- Una petición termina al recibir todas sus categorías, incluso si la lista de permisos llega después de los datos. Respuestas duplicadas, antiguas, de otra cuenta o posteriores al timeout no modifican el diario.
- Ventana de 28 días también para pasos, coordinada con la agregación diaria nativa. Una instantánea correcta reconcilia los registros propios de este teléfono en esa ventana; no elimina por error los procedentes de otro teléfono.
- Mientras Vera está activa, se revisa la necesidad de actualizar cada cinco segundos y se permite una lectura periódica cada minuto. Se actualiza también al volver a la app y tras acciones, con debounce y agrupación. No implica ejecución garantizada con la app cerrada.
- Perfil incorpora estado de lectura, errores y número de registros. Si la lectura correcta no aporta ninguno, explica cómo activar el puente de Google Fit. El estado de lectura no se presenta como confirmación de guardado del servidor.

## Google Fit y Health Connect son dos pasos distintos

La autorización OAuth de Google identifica al usuario; no activa por sí sola el intercambio de datos de Google Fit. Según la [ayuda oficial de Google Fit](https://support.google.com/fit/answer/12830119?hl=en-GG), el usuario debe abrir **Google Fit → Perfil → Ajustes → Sincronizar Fit con Health Connect** y autorizar el intercambio. Vera no puede activar unilateralmente ese ajuste en otra aplicación.

La [documentación oficial de sincronización de Health Connect](https://developer.android.com/health-and-fitness/health-connect/sync-data) diferencia la lectura con la aplicación activa del acceso en segundo plano, que necesita permisos adicionales y una implementación apropiada. Esta entrega no promete sincronización permanente con la app cerrada. La conexión del reloj u otra fuente también debe compartir sus datos con Health Connect para que Vera pueda leerlos.

## Coordinación nativa

El agente de Android actualizó `Main`/`session24.js` para revalidar la sesión al volver al primer plano y solicitar la lectura después de confirmar Google. `cancelHealthRead21()` permite cancelar una lectura ligada a la sesión bloqueada antes de restaurar. `HealthReader` proporciona errores explícitos y agregación diaria de pasos de 28 días, respetando las fechas locales.

## Verificación

- `tests/health-auto24.mjs`: perfil recuperado antes de leer, antiguo interruptor desactivado, coalescing, callbacks fuera de orden, duplicados, error sin borrado, timeout, aislamiento entre cuentas, pasos anteriores, snapshot idéntico, eliminación propia en ventana, guía de Fit y bloqueo/reanudación.
- `tests/audit-health21.mjs`: regresión de identidad, reemplazo de instantánea, cobertura de otros teléfonos, sueño y peso. La prueba de actualización usa un ticket nuevo, como ocurre en una nueva lectura real.
- `tests/audit-frontend-unit.mjs`: 31 comprobaciones aprobadas después del cambio.

Las pruebas JavaScript usan puentes nativos simulados. No sustituyen la comprobación en un teléfono con Google Fit, Health Connect y sus permisos reales. Compilación y entrega final corresponden a la integración principal.
