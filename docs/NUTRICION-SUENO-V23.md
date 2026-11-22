# VERA 2.3 — líquidos de suplementos y descanso

## Implementación

- Cada suplemento guarda su propio `mixingLiquid`. No crea otro registro de comida o agua: modificar o eliminar el suplemento modifica/elimina también su contribución de líquido.
- Opciones: sin líquido, agua, leche, bebida vegetal. El usuario registra ml y copia los nutrientes del envase por 100 ml. No hay una composición genérica inventada para todas las leches. Etiqueta y marca quedan guardadas.
- `nutritionValue21` suma polvo y líquido; `baseNutritionValue21` permite editar el polvo sin sumar la leche otra vez. Los campos desconocidos permanecen desconocidos. La cobertura se marca parcial si falta parte de la mezcla.
- Progreso suma el volumen de líquidos de suplementos y agua. Lo identifica como volumen de líquidos, no como contenido de agua pura de leche ni alimentos.
- Sueño: fecha de despertar, minutos de vigilia descontados, noches y siestas, resumen de siete días y edición del registro manual. Objetivo en Perfil.
- Se conservan intervalos de sueño de Health Connect (`sleepSpans`) para unir solapamientos y descontar vigilia sin doble conteo. La corrección manual sustituye sólo su intervalo; una siesta manual puede sumarse a una noche importada.
- Datos históricos importados sin horario no permiten situar la siesta frente al total diario: se muestra advertencia y no se inventa una fusión. La próxima importación aporta intervalos.
- Cargar `sleep23.js` después de `health21.js` y del resto de wrappers de sueño. Backend admite `mixingLiquid` y `sleepSpans`.

## Fuentes primarias consultadas (22/11/2026)

- [AESAN: información nutricional](https://www.aesan.gob.es/seguridad-alimentaria/informacion-alimentaria/informacion-nutricional): expresión de etiqueta por 100 g / 100 ml. La app usa esta base para escalar por volumen realmente registrado.
- [Android: seguimiento de sesiones de sueño](https://developer.android.com/health-and-fitness/health-connect/features/sleep-sessions): sesiones nocturnas y siestas, fases y vigilia.
- [Android: SleepSessionRecord](https://developer.android.com/reference/androidx/health/connect/client/records/SleepSessionRecord): contratos y tipos de fase.

## Validación

`node tests/nutrition23.mjs`: leche por volumen, macros/micros, campos ausentes, edición, cambio a agua, invalidación, deduplicación y eliminación.

`node tests/sleep23.mjs`: noche cruzando medianoche, vigilia y solapamiento de fases, siesta, unión de fuentes, corrección manual, ausencia de datos, legado sin horario, guardado y edición.

`node tests/nutrition22.mjs`: regresión del catálogo, conversión de dosis y métricas anteriores.

`node tests/nutrition23-persistence.mjs`: handlers reales de formulario, VeraJournal, backend SQLite aislado, recarga nueva, edición y eliminación, perfil/objetivo, intervalos Health Connect e hidratación externa. Detectó y corrigió el envío de mixingLiquid nulo: ahora el campo se omite cuando no hay líquido.

Pendiente de la integración principal: servidor desplegado, WebView/APK y permisos/importación en teléfono físico.
