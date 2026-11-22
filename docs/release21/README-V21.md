# VERA 2.1 beta

## Interfaz y métricas
Tema claro blanco/lima; texto principal y secundario oscuro, campos blancos, foco visible y controles táctiles. Contrastes de las combinaciones principales verificados en CONTRASTES-CLARO.json. La revisión visual en navegador se coordina por separado; no equivale a validar Android.

Progreso incorpora Nutrición y peso para 7/28/90 días. Macros: energía, proteína, hidratos y grasa. Micronutrientes anotados: fibra, azúcares, sodio, potasio, calcio, hierro, magnesio, vitaminas C, D y B12. Se incluyen nutrientes confirmados de comidas y suplementos; la dosis de un suplemento no se utiliza como energía. Ausencia de dato no equivale a cero. Se muestra cobertura por nutriente.

Los registros se deduplican por identificador. Se obtiene cada total diario por fuente (Diario o Health Connect), se calcula la media de las fuentes que disponen del nutriente y luego la media de los días con datos. No se suman consumos de diferentes fuentes. La tabla muestra cada fuente por separado y permite reconocer coberturas incompletas. Google Fit sólo llega mediante Health Connect cuando comparte datos.

Peso: selector de todos/ayunas/otros, media de lecturas por fecha y media del periodo a partir de esas medias diarias. La tabla desglosa fuente y condición. No se presupone que un pesaje importado sea en ayunas ni se interpolan días vacíos.

## Uso
Vera prepara registros a partir de mensajes e imágenes y una fecha de referencia. Revisar y confirmar antes de incorporarlos al diario. Equipo reúne revisiones de entrenamiento, nutrición y recuperación y explica su coordinación semanal. La revisión automática es opcional; se conserva el plan si una revisión falla. Marcar una tarea no crea un registro ficticio de actividad.

## Actualización
Se conserva la firma V2 y se aumenta versionCode a 210. Se instala encima de V2.0, sin desinstalar. Exportar respaldo previo sigue siendo recomendable. Versiones con firma anterior necesitan respaldo y reinstalación.

## Verificación
El manual y VERIFICACION.txt de la entrega identifican las pruebas y el estado real del despliegue. Las pruebas de formato, código y proveedores no sustituyen una instalación en un dispositivo Android real.
