# Rediseño visual final VERA V2.0 beta

22/11/2026. Esta pasada responde a la petición de renovar la apariencia, además de los ajustes puntuales de contraste anteriores. Archivo funcional modificado: `www/perf6.css`. No se modifican solicitudes de IA, claves, datos ni lógica de entrenamiento.

## Dirección visual

VERA Performance: fondo bosque profundo, superficies verdes escalonadas, acentos menta y lima reservada para acciones principales y cifras. Se conserva el icono V y la marca HTML VERA / 2.0 BETA. No se añaden fotografías decorativas, fuentes externas ni descargas; el diseño forma parte de los recursos incluidos en la APK.

La hoja sustituye acumulaciones contradictorias de estilos claros/oscuros por variables y reglas agrupadas. Tipografía de sistema con títulos más claros, cifras tabulares, espaciado consistente, bordes diferenciados y radios coherentes. El objetivo es que registrar y leer resulte más fácil, sin afirmar mejoras de uso todavía no medidas.

## Cambios integrados

- Cabecera más ordenada, herramientas secundarias diferenciadas y marca conservada. Se adapta mediante salto de línea en móviles estrechos.
- Navegación completa con etiquetas, estado activo en lima y desplazamiento horizontal visible. No se comprimen todos los destinos en una barra inferior ni se ocultan opciones.
- Inicio con bloque principal de entrenamiento, jerarquía clara de métricas y tarjetas de accesos con separación suficiente. Los números largos pueden partirse y las métricas redistribuirse.
- Formularios con campos oscuros definidos, texto/placeholder legibles, controles de al menos 48 px CSS, foco visible y selección de checkbox clara. No se afirma equivalencia medida con dp físicos de Android.
- Conversación con burbujas diferenciadas, contenido largo que puede partirse, tablas desplazables y controles de audio que ocupan el ancho disponible.
- Gráficos integrados en el tema oscuro, líneas y barras menta, fechas legibles y cifras tabulares. Se conservan datos y semántica.
- Registro de series y temporizador con jerarquía más clara. En pantallas de hasta 400 px los pares de campos pasan a una columna; hasta 340 px se simplifican accesos y métricas.
- Diálogos y mensajes de estado coherentes. Se respeta `prefers-reduced-motion`; no hay animaciones decorativas ni desplazamientos de contenido por hover.

## Verificación

- Suite existente `tests/audit-frontend-unit.mjs`: **31/31 grupos PASS** tras sustituir la hoja de estilo. Son pruebas lógicas en VM/DOM mínimo, no pruebas de aspecto visual.
- Contrastes de los colores definidos: texto principal 14,22:1; secundario 9,22:1; acción principal 13,23:1; placeholder 10,25:1; texto sobre el extremo más claro del hero 10,90:1; foco 12:1. Bordes de campos 4,17:1. Datos en `REDISENO-CONTRASTES.json`.
- Las combinaciones textuales medidas superan 4,5:1 y el borde medido supera 3:1. Esto no acredita conformidad WCAG completa ni estilos computados en un navegador real.
- Sin nuevas dependencias, scripts, imágenes ni inferencia local. La APK debe reconstruirse para incluir esta hoja.

## Pendiente en dispositivo

Revisión visual de inicio, acceso, chat, gráficos y formularios con el tamaño de letra del usuario; navegación por teclado/TalkBack, selector de archivos, teclado abierto, controles nativos de audio y notch. No se ha utilizado navegador o emulador para esta revisión y no se presentan maquetas como capturas de la aplicación ejecutada.
