# VERA: auditoría y correcciones de backend

Fecha de ejecución local: 22/11/2026. Fuente: `work/original/github`, extraída del ZIP aportado. Cambios: `work/vera`. No se ha utilizado ni modificado la base de datos de producción.

## Hallazgos verificados

| ID | Prioridad | Evidencia original | Efecto | Corrección y verificación |
|---|---|---|---|---|
| B01 | P1 | `journal.mjs:6–12` | Una primera escritura se conserva aunque una entrada posterior provoque error. El cliente recibe error para un lote parcialmente guardado. | Prevalidación del lote entero y `db.batch(..., 'write')` transaccional, incluyendo lectura de revisiones y página. Pruebas de rechazo previo y rollback SQL provocado mediante trigger. Reproducido antes y corregido. |
| B02 | P1 | `journal.mjs:9` | La fecha se valida únicamente por formato. Se guardaban 30 de febrero, sueño negativo, tipos arbitrarios, repeticiones imposibles y cantidades no numéricas. | Validación de calendario real, lista de tipos existentes, cantidades no negativas, RIR/RPE, repeticiones, duración e intervalo de sueño. Se preservan los números en texto que producen formularios antiguos. Reproducidos fecha imposible y sueño negativo. |
| B03 | P2 | `accounts.mjs:13,56,97–99` | Rate limit, contraseña incorrecta y colisión de nick acababan como HTTP400 genérico. | Status429,401,409 y422 diferenciados. Nick acepta `@`, espacios exteriores y colisión sin distinguir mayúsculas. Verificado con cuentas sintéticas. |
| B04 | P2 | `accounts.mjs:73,81` | Se aceptaba un token desnudo sin esquema de autenticación. No es un bypass sin credenciales: requería poseer el token real. | Validación explícita de `Bearer` y formato de token. Mayúsculas/minúsculas del esquema compatibles; logout idempotente. Reproducido antes. |
| B05 | P2 | `accounts.mjs:86–89` | Configurar cuota `1.5` permitía dos consumos; NaN/Infinity/negativos no se diagnosticaban como error de configuración. | Entero seguro no negativo o503. Cuota0 bloquea y se comprueba carrera de8 solicitudes con cuota2; exactamente2 reservas. Reproducida configuración fraccionaria. |
| B06 | P2 | `business.mjs` | Datos administrativos malformados producían errores internos; una URL podía almacenar credenciales; el estado sólo describía OpenAI aunque el proveedor activo cambiara. | Validación de tipos/longitudes/URL sin usuario/contraseña; control de rol también dentro del servicio; estado del proveedor activo. Con Groq, prospección devuelve501 hasta que exista búsqueda verificada, sin llamar a otro proveedor. |
| B07 | P2 | `owner.mjs:18`, `accounts.mjs:55` | Un hash heredado malformado podía lanzar excepción de comparación en lugar de denegar credenciales. | Longitud/formato comprobados, límites de entrada administrativos y respuesta401. Revisado en código; no se han alterado credenciales heredadas reales. |
| B08 | P2 | `partners.mjs:14` | El mecanismo auxiliar podía crear un nick `vera_` + UID completo, más largo que los24 caracteres permitidos por el editor. | Mismo sufijo de19 caracteres que registro/migración. Sólo afecta creación auxiliar; no renombra nicks existentes. |
| B09 | P2 | `storage.mjs` | Limpieza de sesiones por caducidad y agregados diarios sin índices específicos. | Índices aditivos `sessions_expires`, `sessions_uid`, `quota_day`. No hay cambios destructivos de tablas. Mejora estructural; no se ofrece benchmark de producción. |
| B10 | P0 si se usa la credencial heredada | `owner.mjs:4,18`; el agente principal verificó `owner.json` público en GitHub, ausente del ZIP | Un hash y salt públicos permiten intentos de descifrado offline; el backend aceptaba ese archivo como acceso administrativo sin activación explícita. No se afirma que la contraseña haya sido descifrada. | El archivo queda ignorado por defecto. Compatibilidad sólo con `VERA_ALLOW_LEGACY_OWNER_FILE=true`; la recomendación es no activarla y rotar la contraseña administrativa mediante variables de entorno.3 pruebas con archivo sintético verifican desactivación, opt-in y denegación de hash malformado. |

## Pruebas ejecutadas

`node tests/audit-backend.mjs`: **15 grupos de pruebas superados** contra SQLite local temporal. Incluyen prevalidación sin escritura, rollback SQL real, validaciones, compatibilidad con registros antiguos, reintentos, conflictos, borrado, aislamiento, concurrencia, paginación de55 entradas, auth, nick, expiración,429, cuotas, salas privadas, roles administrativos y selección de proveedor. El archivo elimina su base temporal al terminar.

`node tests/audit-backend-baseline.mjs`: **5 reproducciones del original**. Importa el código original intacto y redirige únicamente su import de almacenamiento a una base temporal: escritura parcial, calendario/sueño inválidos, token desnudo, rate limit sin429 y cuota fraccionaria. Requiere `work/original/github`, por eso debe excluirse de los tests portables de una entrega aislada o acompañarse del original.

Regresiones existentes ejecutadas y superadas: `tests/acceptance103.mjs`, `tests/journal.mjs`, `tests/partners.mjs`, `tests/admin103.mjs`.

`node tests/audit-backend-owner.mjs`: **3 comprobaciones superadas** para acceso administrativo heredado desactivado por defecto. No lee, imprime ni modifica el archivo público real ni su contenido.

No se han usado mocks para afirmar persistencia o aislamiento: las pruebas realizan SQL real. La prueba de proveedor administrativo sólo comprueba configuración y bloqueo de ruta; no demuestra disponibilidad de Groq ni salida de un modelo.

## Aspectos positivos conservados

- Consultas SQL parametrizadas en los módulos inspeccionados; no se encontró concatenación de datos de usuario en SQL. Las columnas dinámicas de salas se eligen entre valores internos fijos.
- Scrypt con salt y tokens aleatorios de32 bytes; las sesiones de usuario se almacenan como hash.
- Diario con clave compuesta por usuario/registro; salas consultadas por pertenencia y nick único sin distinguir mayúsculas.
- La reserva de cuota ya era atómica y los eventos de series ya eran idempotentes. Se añadieron regresiones y se conservó ese comportamiento.
- Roles administrativos y cookie HttpOnly/SameSite con CSRF; pruebas existentes conservadas.

## Limitaciones y siguientes pasos

1. La aplicación conserva diario local con sincronización manual. Estas correcciones no convierten todo el producto en backend autoritativo ni migran perfil/chat/memoria. Eso requiere diseñar migración, sincronización y recuperación de conflictos sin perder datos históricos.
2. El limitador de autenticación sigue siendo memoria por instancia y por IP. En Render hay que definir explícitamente el proxy de confianza; confiar indiscriminadamente en `X-Forwarded-For` permite evasión, pero usar siempre `remoteAddress` puede agrupar usuarios. Recomendación: limitación compartida por cuenta/IP con configuración validada de proxy y observabilidad.
3. No hay flujo verificado de recuperación de contraseña, verificación de email, revocación de todas las sesiones, exportación/eliminación completa de cuenta ni política automatizada de retención. Deben priorizarse antes de comercialización.
4. Las tablas heredadas no contienen todas las claves foráneas. No se añaden mediante recreación automática: requiere copia de seguridad, análisis de huérfanos y migración probada sobre copia de datos.
5. Las sesiones administrativas viven en memoria; reinicio implica nuevo login y despliegue multiinstancia requiere almacenamiento compartido.
6. La puntuación social sólo cuenta eventos autodeclarados y no constituye una medida validada de rendimiento ni un sistema antifraude completo. Se preserva la privacidad y la idempotencia de sus eventos.
7. No se probaron Turso remoto, carga productiva, fallos de red entre regiones, claves reales de IA ni cuentas reales. Estas comprobaciones deben figurar como pendientes de despliegue, no como fallos ya corregidos.

## Archivos modificados

`accounts.mjs`, `storage.mjs`, `journal.mjs`, `business.mjs`, `owner.mjs`, `partners.mjs`; añadidos `tests/audit-backend.mjs`, `tests/audit-backend-owner.mjs` y `tests/audit-backend-baseline.mjs`. `routing.mjs` no necesitó cambios. La integración HTTP y el adaptador `ai-provider.mjs` son responsabilidad del agente principal.
