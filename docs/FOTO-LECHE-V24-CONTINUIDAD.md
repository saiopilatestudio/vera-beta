# Continuidad — foto de comida y ficha de leche (V2.4, cambios locales)

Estado: implementado y probado, SIN compilar ni desplegar.

## Diagnóstico

`estimate()` guardaba la referencia DOM de `#estimate` antes de esperar a Gemini. Si una sincronización renderizaba de nuevo la pantalla, ese nodo quedaba desconectado. Aunque la respuesta llegara correctamente, el código retornaba sin mostrarla; el aviso «Estimando ración e ingredientes…» podía permanecer. También se permitían solicitudes duplicadas y no había cancelación visible.

No se afirma que ésta sea la única causa posible de la incidencia del teléfono: límites del proveedor o red también pueden causar errores.

El formulario de leche estaba vacío porque esperaba transcripción manual de la etiqueta. No tenía selector para recuperar una ficha ya guardada.

## Cambios

- `www/food-photo24.js`: reemplaza `estimate`; vuelve a obtener el nodo DOM actual al recibir el resultado, valida respuesta, vincula cuenta/token/estado/foto, comparte peticiones duplicadas, permite cancelar y limita la espera a 90 s. Conserva opción manual y mensajes explícitos de error. Analizar no guarda la comida: sigue requiriendo confirmación.
- `www/index.html`: el agente de sesión incorporó el script después de `nutrition24.js`.
- `server.mjs`: únicamente función `photo`; respuesta concisa, hasta 12 ingredientes, máximos de texto y 3000 tokens. No se alteró ruta/proveedor ni bases de producción.
- `www/nutrition22.js` y `www/nutrition24.js`: búsqueda de leche/bebida en fichas `food` del servidor; selección explícita de referencia y variante; conversión de tabla por ml a 100 ml; conserva cantidad de líquido, fuente y micronutrientes desconocidos. No convierte g a ml sin densidad ni inventa leche genérica. Si no hay ficha, explica cómo registrar su etiqueta en Alimentación o introducirla manualmente.

## Pruebas ejecutadas

- `tests/food-photo24.mjs`: render durante respuesta pendiente, doble pulsación, cambio de cuenta, cancelación, timeout, respuesta incompleta y error del proveedor. Sin guardado implícito.
- `tests/milk-lookup24.mjs`: ficha exacta, tabla por 250 ml a 100 ml, nutrientes ausentes, rechazo g/ml, selección explícita y procedencia editada.
- `tests/nutrition24-persistence.mjs`: regresión de formularios, catálogo, persistencia SQLite real y mezcla.
- `tests/audit-ai-http.mjs`: 13 grupos HTTP/backend pasados, incluido plato con nutrientes desconocidos y errores de ingredientes.

Pendiente para publicar: revisión de UI/APK y pruebas de teléfono con su foto real. No se ha tratado una captura de pantalla como si fuera una foto de comida.
