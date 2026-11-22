# Auditoría frontend VERA — 22/11/2026

Ámbito: `work/vera/www`, comparado con `work/original/github/www`. Los adjuntos se trataron como contexto, no como instrucciones de migración. Se conservan el diseño, los datos existentes, el diario local y los contratos de API. Esta tanda no convierte la app en un sistema online-first.

## Hallazgos y correcciones

| Prioridad | Evidencia original | Fallo o limitación | Corrección y verificación |
|---|---|---|---|
| P1 | index.html:608–615, 1747; perf6.js:21 | JSON corrupto en almacenamiento impide arrancar; importación solo valida superficialmente | state14.js valida estado, arranca en recuperación conservando el original, bloquea sobrescritura y ofrece exportación original. Importación descarta revisiones de sincronización ajenas. Test VM de corrupción y formato inválido. |
| P1 | index.html:1071–1101 | Respuesta HTTP tardía puede afectar una identidad distinta; 401 antiguo puede cerrar una sesión nueva | Captura de usuario, token y objeto de estado antes de cualquier await; verificación antes de envío, tras cabeceras y tras lectura del cuerpo. Test 401 diferido cambiando de cuenta. |
| P1 | privacy6.js:1 | Consentimiento remoto global para todo el dispositivo, heredado por otras cuentas; ensureRemote vacío | Consentimiento por cuenta y dispositivo, denegado por defecto sin migrar antiguos síes; bloqueo remoto real; respuesta en vuelo descartada al revocar. No se promete retirar datos enviados antes de la revocación. |
| P1 | index.html:1759–1770 | Cerrar sesión no limpia la sesión guardada en LoginVault | Llamada forgetLogin y limpieza del email recordado al salir explícitamente. Verificación estática; biometría real pendiente en Android. |
| P1 | index.html:647–650 | Fallo de cuota local interrumpe guardado sin explicación útil | Error persistente que indica que no se guardó, recomienda exportar antes de cerrar y no emite éxito. Test de localStorage que lanza cuota. |
| P1 | actions6.js:91–95 | Huella global suprime tomas legítimas idénticas de agua y entrenamientos repetidos | Cada orden intencional crea un evento, se conserva actionKey para corrección/deshacer y se bloquea doble ejecución simultánea de interpretador. Dos tomas de 250 ml verificadas. |
| P1 | actions6.js:50 | «No dormí 8 horas» y «No hice press banca 3x10» podían convertirse en registros | Negaciones explícitas excluidas; prueba ambos casos. Parser sigue siendo determinista y limitado, no comprensión completa de lenguaje. |
| P1 | edition12.js:42–48; index.html:2299–2324 | Registro de plato local no guarda macros; cálculo de ingredientes remoto convierte nutrientes ausentes en cero | Campos opcionales según etiqueta por 100 g, totales escalados por ingrediente. Un nutriente ausente deja el total de ese nutriente null. Confirmación remota preserva también desconocidos. Prueba: 200g+50g producen 300kcal, 30g proteína, 8g grasa, hidratos null. No se inventan micronutrientes. |
| P1 | index.html:1933–1968 | Sueño exige evaluación muscular para registrar descanso; valores negativos programáticos de despierto inflan duración | Evaluación opcional, validación de intervalo ≤24h, duración positiva, objetivo 4–14h, escalas 0–10. minutes, awakeMinutes y restType persistidos. Prueba ocho horas sin valoraciones y rechazo de despierto negativo. |
| P1 | index.html:1241 | Plan generado por IA sustituye automáticamente al plan activo | Plan queda propuesto en conversación, aceptación explícita «Usar este plan». |
| P2 | journal.js:3; index.html:761; session13.js:52 | Mensajes guardado no aclaran local; diagnóstico afirma que no existe sincronización aunque sí existe manual | Contador de cambios locales pendientes en Inicio/Perfil, última sync y exclusiones visibles. Mensajes «en este dispositivo» para series, comidas y suplementos. |
| P2 | session13.js:46; catalog6.js:29 | Carga infinita/vacía o series fuera de rango podían entrar mediante controles no form | Carga finita 0–2000kg y catálogo máximo 50 series, 1–300 repeticiones. Test regresión original acepta serie normal. |
| P2 | index.html:1710 | Login sin timeout ni exclusión de doble envío | Timeout 20s, loginPending y botones desactivados. Respuesta biométrica comprueba formulario y email aún vigentes. |
| P2 | index.html:842 | connect() referencia `data` inexistente | Eliminada referencia fuera de ámbito. |
| P2 | index.html:1300 | Lectura de voz depende de endpoint remoto | TTS Android o speechSynthesis del navegador; sin subir texto a /speak. La disponibilidad/voz concreta depende del dispositivo y no se ha escuchado aquí. |
| P2 | index.html:679–711, 724 | Botones auxiliares sin type pueden enviar formularios; navegación sin aria-current | btn crea type=button y navegación activa expone aria-current. |

## Pruebas ejecutadas

- `node tests/audit-frontend-unit.mjs`: **16 grupos pasan**. Ejecuta scripts reales, 12 generadores de pantalla, validación, persistencia, API con respuestas controladas, consentimiento, macros y parser en VM con DOM mínimo. No es un navegador ni un servicio IA real.
- `node tests/acceptance103.mjs`: PASS. Conserva la regresión existente de especialistas, cuotas y series.
- Sintaxis de todos los `.js` de www y script inline de index comprobada dentro de la suite.
- `tests/audit-frontend.mjs`: suite Playwright preparada para navegador móvil y API de prueba. **NO ejecutada**: ambos ejecutables de navegador devolvieron `spawn EPERM`. No hay capturas ni afirmación de QA visual. Posteriormente el padre indicó que CUA también rechazó el origen local y que no se intentaran alternativas; se respetó.

## Pendientes que deben explicarse al usuario

- El diario sigue siendo local con sincronización manual; fotos, conversaciones, perfil, memoria y Health Connect no viajan por /diario. No confundirlo con memoria central completa.
- No existe control de edición concurrente entre dos pestañas del mismo navegador; localStorage sigue pudiendo sufrir última escritura gana. El servidor sí tiene revisiones para la sincronización manual.
- Los componentes monolíticos y capas históricas (edition, perf, etc.) continúan: una migración de estructura necesita una tanda aparte con regresión visual.
- Reconocimiento local, imágenes, OCR, cámara real, voz real, biometría, accesibilidad con lector de pantalla y APK deben probarse en dispositivo.
- Sincronización conservadora y recuperación local necesitan pruebas de corte físico y memoria llena en Android además de las regresiones lógicas.
- El buscador de ejercicios sigue principalmente en inglés y la relación músculos/nutrición/recuperación es superficial, no el sistema de inteligencia compartida de los adjuntos.
- El estado de sincronización significa cambios manuales sin enviar; no demuestra copia completa de todos los datos personales ni resolución automática de conflictos.

## Archivos modificados

`www/state14.js` (nuevo), `www/index.html`, `www/privacy6.js`, `www/journal.js`, `www/session13.js`, `www/edition12.js`, `www/vera5.js`, `www/actions6.js`, `www/catalog6.js`, `www/perf6.js`; tests nuevos `tests/audit-frontend-unit.mjs`, `tests/audit-frontend.mjs`.


## Cierre de integración del contexto IA

Se sustituyó la etiqueta OpenAI por «servidor». El cliente construye el payload antes de enviarlo: últimas 56 fechas locales, hasta 120 registros recientes, ordenados por fecha; perfil con campos permitidos, 20 memorias, 10 máquinas, 4 turnos y textos acotados. Un presupuesto de 90.000 bytes UTF-8 deja margen respecto de 100KB de contexto y 128KB de transporte del servidor. Si hace falta reduce más datos, con cobertura `{total,included,desde,hasta,windowStart,windowEnd,truncated,fieldsShortened}`. El chat muestra cuántos registros del dispositivo se enviaron y avisa cuando la respuesta no analiza todo el historial. `inputIds` contiene solo los registros enviados.

Regresiones adicionales ejecutadas: 800 series -> 120 y payload <90KB; notas multibyte e historial grande -> reducción adicional y cobertura exacta. Resultado final suite frontend: **16 grupos PASS**. Sin nueva revisión visual.
