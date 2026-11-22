# Revisión de diseño gráfico y estilo - VERA 2.0 beta

Fecha: 22/11/2026. Alcance: lectura de HTML/CSS/JS e inspección del bitmap de marca. No se abrió un navegador ni se realizó una sesión visual en un teléfono. Se respetó la restricción existente sobre navegación automatizada.

## Cinco mejoras revisadas

1. **Contraste del tema oscuro, corregido.** Quedaban reglas del tema claro en bienvenida/acceso, selector de fotografías, fechas de barras y botones de sesión. Se armonizaron en `www/perf6.css`. Ratios calculados con luminancia relativa sobre los colores declarados: bienvenida 2,21:1 → 9,13:1; etiquetas de fotografía 1,01:1 → 13,10:1; fechas de barras 2,14:1 → 9,13:1; texto de botón de sesión 1,06:1 → 13,80:1. El placeholder explícito queda en 9,59:1. Estas cifras no equivalen a una auditoría visual completa. Referencia: [W3C, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

2. **Foco perceptible, corregido.** Las reglas de controles específicos prevalecían sobre el selector genérico del foco. Se aplicó el mismo contorno lima a botón, campo, selector, textarea, summary y enlace. Los controles de cámara con input invisible muestran ahora el contorno en el contenedor mediante `:focus-within`.

3. **Controles táctiles, mejorados.** Los desplegables `summary` y etiquetas checkbox tienen un área vertical mínima de 44 CSS px. El checkbox conserva un control de 24×24 px dentro de su etiqueta activable. La mejora aumenta el área de interacción sin cambiar los permisos ni el consentimiento. No se declara conformidad global por estas reglas aisladas. Referencia: [W3C, tamaño mínimo de objetivos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

4. **Pantallas estrechas, mejoradas.** A 360 px o menos los accesos de inicio se organizan en una columna y se ajustan márgenes. Las métricas permiten salto de línea y redistribución de tarjetas, evitando depender del recorte horizontal global cuando aparece una cantidad larga. Se añadió separación de cabecera y un ancho mínimo flexible a sus herramientas.

5. **Identidad V2 y honestidad del producto, verificadas por código.** La marca conserva el icono V y utiliza texto HTML accesible `VERA / 2.0 BETA`. El recorte de 42 px muestra únicamente el icono del bitmap histórico; el texto 1.0 del bitmap queda fuera. Los textos funcionales de la edición final explican el reparto Groq/Gemini, conexión/consentimiento y voz española remota; no se añadieron promesas comerciales ni funciones ficticias. Pendiente visual en dispositivo: comprobar el recorte, escala de texto del sistema y cabecera real. Como ajuste posterior menor, el `theme-color` histórico del HTML sigue claro aunque la interfaz sea oscura; no se modificó HTML por separación de responsabilidades.

## Cambios y verificación

- Único archivo funcional modificado: `www/perf6.css`; añadido un bloque final comentado de reglas V2.
- `tests/audit-frontend-unit.mjs`: 21 grupos PASS en la revisión de CSS; la integración final posterior ejecuta 31 grupos, descritos en CIERRE-V2.md (VM con DOM mínimo, no navegador).
- Cálculo de ratios: `work/v2-design-contrast.json` y script `work/v2-design-check.py`.
- Lectura de la cascada CSS y revisión del bitmap original, sin generar imágenes nuevas ni alterar JavaScript.
- Los cambios CSS requieren recompilar la APK para incluir el nuevo recurso. No se cambiaron modelos, proveedor, endpoints, permisos o datos.

## Límites

No se afirma validación WCAG completa, revisión TalkBack, medición de tamaños efectivos en pantalla ni pruebas con aumento de fuente. Quedan para una pasada visual en Android real las pantallas de inicio, registro, chat con adjunto, gráficos, formularios largos y navegación con teclado/lector. Esta revisión corrige defectos demostrables del código sin sustituir esas pruebas.
