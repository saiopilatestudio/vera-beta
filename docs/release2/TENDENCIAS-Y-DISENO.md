# Tendencias útiles y decisiones de diseño para VERA V2

Revisión del 22/11/2026. Se consultaron fuentes oficiales actuales de producto y guías de interfaz. No es una encuesta de mercado ni prueba de que una estética aumente conversiones. No se copiaron pantallas, marcas o activos de otras aplicaciones. La revisión se basa en código y documentación; no incluye observación del navegador del usuario ni pruebas visuales en Android.

## Cinco patrones recomendados

### 1. La acción principal debe preceder a la decoración

La guía oficial de Hevy organiza el producto alrededor de registrar series, preparar rutinas y revisar progreso. Es evidencia de cómo otro producto estructura sus funciones, no de eficacia ni superioridad. Para VERA recomiendo que «Empezar entrenamiento» conserve la máxima jerarquía visual y que el volumen y los días registrados se lean antes que elementos promocionales. Las funciones de nutrición y descanso deben mantenerse accesibles sin competir todas como botón principal. [Fuente: guía de funciones Hevy](https://help.hevyapp.com/hc/en-us/articles/33106320824727-Everything-You-Need-to-Know-About-the-Hevy-App-2026-Features-Guide).

### 2. Navegación visible y de significado estable

Material reserva la navegación inferior para tres a cinco destinos principales. VERA tiene más apartados; no conviene forzarlos todos en una barra compacta con iconos sin texto. En esta revisión CSS se recomienda conservar las rutas, distinguir con claridad la activa y hacer evidente que la fila puede desplazarse. Una reorganización futura en menos destinos requiere cambios funcionales y pruebas de encontrabilidad, no sólo CSS. [Fuente: Material, navegación](https://m2.material.io/design/navigation/).

### 3. Apariencia cuidada con controles utilizables

Android recomienda objetivos táctiles de al menos 48dp y contraste de texto normal de al menos 4,5:1. Para la interfaz WebView de VERA se proponen controles CSS de 48px como base, con verificación posterior de su tamaño efectivo en dispositivo; no se afirma equivalencia automática entre unidades. La paleta oscura puede usar superficies diferenciadas, texto claro y lima para acciones prioritarias. Bordes, etiquetas y foco visible deben seguir funcionando sin depender sólo del color. [Fuente: accesibilidad Android](https://developer.android.com/guide/topics/ui/accessibility/apps).

### 4. Movimiento discreto y opcional

El movimiento no debe estorbar al introducir cargas o consultar cifras. Se recomienda evitar parallax, destellos y animaciones continuas; cualquier transición decorativa debe respetar `prefers-reduced-motion`. Esto no constituye una certificación WCAG de toda la aplicación. [Fuente: W3C, animación por interacción](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).

### 5. La claridad del estado forma parte de la marca

Recomendación propia basada en el código y las limitaciones de VERA: diferenciar visualmente registro local, sincronización confirmada y solicitud de IA. Mantener visibles los nombres Groq/Gemini donde ayudan a entender quién recibe datos; no llenar la pantalla de nombres de modelos. La configuración incompleta no debe parecer una recomendación ya calculada. El aviso inicial debe informar; la cuenta autenticada decide sobre la IA. Evitar promesas como «entrenador médico», «resultado garantizado» o «todo sincronizado».

## Aplicación y alcance

Estas recomendaciones se enviaron al especialista que modifica `www/perf6.css`. Este documento no declara por sí solo que se hayan implementado todas. El registro concreto de cambios y verificaciones está en `REDISENO-VISUAL.md`; la compilación debe incorporar el CSS definitivo.

Permanecen fuera de este cambio: una reorganización completa de navegación, experimentos con usuarios, campañas, métricas de conversión, traducción íntegra del catálogo y cualquier función que no exista en la fuente. No se publicaron anuncios ni se contactó con terceros.

La IA continúa exclusivamente en Groq y Gemini, a través del servidor. No se incorporan modelos locales, rastreadores de marketing ni nuevas bibliotecas visuales externas.

## Comprobación posterior propuesta

En un teléfono de prueba, con datos ficticios: localizar el inicio de entrenamiento, guardar una serie, corregirla, reconocer el estado de sincronización y encontrar el permiso de IA. Probar tamaño de letra aumentado, teclado, TalkBack y pantallas estrechas. Anotar dificultades observadas sin inventar porcentajes de mejora ni recoger datos de salud para marketing.
