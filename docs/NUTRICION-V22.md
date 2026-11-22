# Nutrición VERA 2.2

Revisión de las tablas oficiales: 22 de noviembre de 2026. Datos por porción, vinculados a variante y sabor; no se transfieren a otros sabores. La cantidad registrada escala los nutrientes de la etiqueta. Ración significa la porción identificada; un scoop sin masa conocida no se convierte en gramos.

Productos iniciales verificados:

- [Whey Concentrada, chocolate](https://www.zumub.com/ES/proteinas/suero/100-whey-concentrate-1kg-p-10326): por 30 g, 110 kcal; proteína 21,4 g, hidratos 1,7 g, grasa 1,8 g, fibra 0,6 g, azúcar 1,2 g, sal 0,3 g.
- [Whey Aislada, chocolate](https://www.zumub.com/ES/aislados-de-suero/100-whey-isolate-flav-1kg): por 30 g, 109 kcal; proteína 24,7 g, hidratos 1 g, grasa 0,6 g, fibra 0,6 g, azúcar 0,5 g, sal 0,3 g.
- [Harina de avena, chocolate](https://www.zumub.com/ES/nutricion-deportiva/avena/harina-de-avena-1kg): por 100 g, 370 kcal; proteína 12 g, hidratos 59 g, grasa 7 g, fibra 10 g, azúcar 1 g, sal 0 g.
- [Multivitamina + Mineral](https://www.zumub.com/ES/multivitamina/zumub-multi-vitamin-mineral-100-capsulas): los 20 micronutrientes de la tabla, por cápsula, incluidos en `zumubProducts22`.
- [Creatina Monohidrato Profesional, sin sabor](https://www.zumub.com/ES/creatina-creatina-monohidrato-c-213_165_74/creatine-monohydrate-professional-100g): 3 g de monohidrato por 3 g; la tabla no declara kcal ni macros. No se inventan ceros.

El catálogo inicial no pretende cubrir toda la gama Zumub. Otras variantes pueden introducirse desde su etiqueta y tienen campos editables. La información de fabricante puede cambiar; siempre se muestra el enlace y se pide comprobar el envase. El sodio se deriva de sal / 2,5, convertido a mg. No se incorporan alegaciones comerciales del fabricante.

Los suplementos guardan explícitamente `kcal`, `protein`, `carbs`, `fat` y `nutrients`. `value` no se interpreta como calorías de un suplemento porque también se empleó para dosis. Los suplementos antiguos sólo recuperan energía calculable mediante `grams` + etiqueta `energy-kcal_100g`. Comidas y suplementos manuales se suman; la combinación posterior con Health Connect conserva la media solicitada por el usuario entre totales de fuentes, por nutriente y fecha. IDs repetidos no cuentan dos veces. Datos ausentes no son cero.

Agua: suma de registros `Agua` en ml, media entre días registrados y porcentaje del objetivo personal `profile.waterGoalMl`. No se prescribe una cantidad universal ni se estima agua en alimentos. La gráfica de barras mantiene la separación temporal real, el círculo de macros convierte gramos con factores 4/4/9 y sólo se dibuja si hay datos de los tres macronutrientes. El peso conserva puntos de observaciones y media diaria sin inventar días intermedios.

Pruebas: `node tests/nutrition22.mjs` y `node tests/metrics21.mjs`. Incluyen escala de dosis, cápsulas sin peso conocido, conversión mg/g y micronutrientes, legado de kcal, suma comida + suplemento, deduplicación de agua, vacíos frente a cero, gráficos sin NaN, guardado/edición y rechazo de negativos.
