# Catálogo y ahorro de consultas V2.4

El catálogo usa SQLite/Turso, con ocho fichas iniciales de etiquetas oficiales Zumub revisadas el 22/11/2026. Las variantes de chocolate no se reutilizan como vainilla o neutro. Las nuevas fichas confirmadas son privadas de cada cuenta; no modifican el catálogo oficial ni el de otros usuarios. Las modificaciones usan revisión para detectar cambios simultáneos. Se admiten 4 valores de energía/macros y 25 campos de fibra, azúcares, vitaminas y minerales, con unidad explícita. Los campos ausentes no equivalen a cero. Las cantidades de la tabla no son recomendaciones de consumo.

POST `/products/search`: `{query, barcode?, variant?, kind?, limit?}`. Devuelve `{products, requiresVariantConfirmation:true}`. Búsqueda normalizada por nombre y alias (incluye error frecuente Zumun); filtro de variante exacto, EAN/UPC/GTIN con dígito de control. El código de barras identifica únicamente los formatos comprobados, no todos los envases de una marca.

POST `/products/confirm`: `{confirmed:true, product:{name,brand,variant,kind,form,portion,unit,facts,aliases?,barcode?,url?,source?}}`. `kind` es `food` o `supplement`. Para editar una ficha privada hay que incluir `id` y `revision` de la búsqueda anterior. Se devuelve `{product}`. No se acepta reemplazar fichas oficiales. `identityConfirmed` describe una confirmación, no certificación clínica o de laboratorio.

`labelCatalogMatches24(uid,label)` devuelve sugerencias sólo ante identidad de alta confianza y marca, nombre y variante presentes. La interfaz exige comprobar y seleccionar la ficha; este helper no mezcla valores nutricionales con la foto.

`cachedLabel24(uid,image,compute,{version,note,ttlMs})` devuelve `{result,cache,expiresAt}`. `version` debe incluir proveedor/modelo y versión del prompt. La clave incluye bytes exactos, MIME y contexto; no es reconocimiento visual de fotos parecidas. Sólo se conserva el hash y resultado validado durante 24 horas por defecto; no la foto. Límite de 100 resultados por cuenta, TTL máximo 7 días. Solicitudes simultáneas iguales comparten una operación dentro del mismo proceso. Una instalación con múltiples procesos puede efectuar una consulta por proceso; no se promete deduplicación distribuida. Los errores no se cachean. El callback compute contiene la cuota y llamada de IA para no consumirlas en aciertos. Añadir catalogMatches después de la caché mantiene actualizadas las fichas privadas.

Fuentes oficiales:
- https://www.zumub.com/ES/proteinas/suero/100-whey-concentrate-1kg-p-10326
- https://www.zumub.com/ES/aislados-de-suero/100-whey-isolate-flav-1kg
- https://www.zumub.com/ES/nutricion-deportiva/avena/harina-de-avena-1kg
- https://www.zumub.com/ES/multivitamina/zumub-multi-vitamin-mineral-100-capsulas
- https://www.zumub.com/ES/creatina-creatina-monohidrato-c-213_165_74/creatine-monohydrate-professional-100g
- https://www.zumub.com/ES/vitamina-c/vitamin1000mg-50-tabletas
- https://www.zumub.com/ES/vitamina-c/vitamina1000-mg-20-comprimidos-efervescentes
- https://www.zumub.com/ES/vitamina-d/vitamin3-120-capsulas
- https://console.groq.com/docs/prompt-caching
- https://console.groq.com/docs/rate-limits
- https://ai.google.dev/gemini-api/docs/caching

Groq y Gemini documentan cachés de prefijos que pueden ahorrar procesamiento; las coincidencias no están garantizadas. La caché de Vera evita llamadas cuando coincide exactamente una etiqueta ya procesada para esa cuenta. Esto no elimina las cuotas gratuitas ni garantiza capacidad ilimitada. No se ha contratado caché explícita de pago ni aumentado cuotas mediante claves alternativas.

Pruebas: `tests/product-catalog24.mjs` y `tests/efficiency24.mjs` verifican aislamiento, variantes, unidades, edición simultánea, persistencia, coincidencias exactas, TTL, deduplicación y errores no guardados. La prueba de ocho llamadas simultáneas produce una sola ejecución del proveedor simulado; no es un porcentaje de ahorro esperado en producción.
