# Nutrición VERA 2.4: diagnóstico y comprobación

## Causas encontradas y corregidas

1. El flujo de fotografía conservaba marca y nombre, pero reemplazaba la tabla por `n:{}` al abrir el formulario. Ahora conserva hechos nutricionales, porción y unidad de la respuesta de Gemini, sin convertir valores desconocidos en cero.
2. Al cambiar la cantidad de una etiqueta introducida manualmente, el formulario recalculaba desde una ficha vacía y borraba micronutrientes. Ahora escala los valores revisados de la dosis anterior cuando las unidades son compatibles.
3. Al corregir una toma privada/manual y cambiar la dosis, faltaba una tabla base con sus micronutrientes. Se reconstruye a partir de la cantidad y nutrientes guardados de esa toma.
4. Las referencias de NIH DSLD encontradas por búsqueda sólo tenían identidad, no la tabla completa. Se identifican expresamente como referencias pendientes de introducir, sin afirmar que contienen una tabla verificada.
5. La búsqueda consulta primero fichas oficiales y privadas del servidor, sin consumir IA. Las fichas privadas se guardan únicamente tras marcar revisión explícita de identidad/valores. No incorporan la leche de la mezcla en la composición del polvo.

## Identidad y unidades

La fotografía nunca recibe valores de un producto sólo por compartir marca. La variante exacta se compara y el usuario selecciona la referencia. Sin base legible de porción y unidad no se presentan cifras como calculables. Cápsulas no se convierten en gramos sin masa conocida. Las fichas admiten g/mg, ml y unidades de consumo; el cálculo conserva campos sin dato.

La tabla de una referencia exacta no prueba que otra fórmula con nombre parecido aporte los mismos nutrientes. Tampoco determina que la dieta cubra necesidades personales.

## Fuentes oficiales revisadas el 22/11/2026

- [Zumub Multivitamina + Mineral, 100 cápsulas](https://www.zumub.com/ES/multivitamina/zumub-multi-vitamin-mineral-100-capsulas): EAN 5600985801514, tabla por una cápsula, veinte vitaminas/minerales declarados. La etiqueta incluye vitamina C, D, B12, calcio y zinc, entre otros. No declara magnesio; su ausencia de datos no equivale a cero ni permite atribuirlo a todos los multivitamínicos. La página declara actualización 20/11/2026.
- [Zumub 100% Whey Concentrada](https://www.zumub.com/ES/proteinas/suero/100-whey-concentrate-1kg-p-10326): múltiples sabores y presentaciones. No se puede asignar la tabla de chocolate a una foto que sólo identifica Whey o a otro sabor.
- [AESAN: información nutricional](https://www.aesan.gob.es/seguridad-alimentaria/informacion-alimentaria/informacion-nutricional): la base de etiqueta por 100 g / 100 ml permite escalar cantidades; las dosis del fabricante deben conservar su denominador explícito.

## Pruebas

- `tests/nutrition24.mjs`: foto preserva micros, campos ilegibles, porción de dos cápsulas, conversión g/mg, rechazo de conversión cápsulas/gramos, variante desconocida, ficha confirmada y ajuste de dosis manual.
- `tests/photo-catalog24.mjs`: handler real de foto retiene tabla y bloquea sesión obsoleta; buscar una ficha conocida no hace llamadas IA ni consultas externas.
- `tests/nutrition24-persistence.mjs`: formulario → VeraJournal → SQLite real → recarga, multivitamínico oficial y ficha privada, dosis una/dos cápsulas, revisión concurrente, privacidad entre cuentas; incluye pruebas anteriores de whey con leche, agua, edición/borrado y sincronización.

Integración: cargar `nutrition24.js` después de `nutrition22.js`. Endpoints autenticados `products/search` y `products/confirm`. El endpoint `label` devuelve `facts`, `portion`, `unit` y candidatas `catalogMatches` independientes; estas candidatas no se guardan automáticamente.

## Completar tomas antiguas y alimentos de marca

En Progreso → Fibra, vitaminas y minerales aparece un desplegable de tomas sin micronutrientes. «Revisar etiqueta» abre la toma; «Completar etiqueta con una ficha exacta» permite buscar y escoger su producto. Sólo después de revisar y guardar se actualiza esa toma, manteniendo ID, fecha, dosis, unidad y líquido. No se aplican valores automáticamente por nombre ambiguo.

Alimentación también consulta fichas privadas `kind:food` antes de los catálogos externos. «Añadir alimento desde su etiqueta» usa la tabla revisable, permite guardar una ficha privada confirmada y registrar comida con macros y micronutrientes. La base puede ser g, mg, ml o raciones. La prueba de persistencia incluye un alimento de marca, reutilización de su ficha y aislamiento entre cuentas.
