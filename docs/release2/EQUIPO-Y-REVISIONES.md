# VERA 2.0 beta: trabajo por especialidades

La revisión se dividió entre subagentes especializados, coordinados e integrados en una única entrega. Trabajaron por tandas; las revisiones de código y documentación no sustituyen ensayos en teléfonos ni la validación con proveedores reales.

| Especialidad | Trabajo realizado | Evidencia o resultado |
|---|---|---|
| Android y distribución | Compilador portable, nueva firma, identidad de paquete, ausencia de inferencia local | `COMPILACION-ANDROID.md`, informe de compilación y verificador APK |
| Backend y datos | Validaciones, diario transaccional, cuotas, acceso administrativo y adaptadores IA | Pruebas backend, HTTP e integración con transporte simulado |
| Programación de interfaz | Privacidad por cuenta, medios asíncronos, respaldo, edición y flujos de IA | Pruebas de lógica frontend y copia/restauración |
| Investigación de producto | Revisión web y contraste con la app heredada | Informes históricos de `docs/audit2026` |
| Diseño gráfico y estilo | Coherencia de marca, contraste del tema oscuro, foco, áreas táctiles y pantallas estrechas | `DISENO-Y-ACCESIBILIDAD.md`, `CONTRASTES.json` |
| Producto y comunicación | Propuesta de valor fiel al código, límites y prueba de diez minutos | `PRODUCTO-Y-BETA.md` |
| Calidad de entrega | Verificación del respaldo dentro de la APK original y coherencia de la migración | Informe de calidad incluido en las evidencias de la entrega |
| Entrenamiento de fuerza | Reproducción de cinco fallos en edición, cargas, RIR y estadísticas | `ENTRENAMIENTO-REVISION.md` y pruebas de regresión tras su integración |
| Ciencia del entrenamiento y técnica | Criterios de progresión, estimación de RIR, dolor e incertidumbre visual | `CRITERIOS-ENTRENAMIENTO.md` con fuentes primarias/oficiales |
| Estrategia de lanzamiento e incorporación | Fricciones de consentimiento, conexión y migración; métricas manuales sin rastreadores | `PLAN-LANZAMIENTO-BETA.md` |
| Ingeniería de integración y privacidad IA | Contratos actuales Gemini, voz española, retención y revisión de la conexión con Groq/Gemini | `REVISION-INTEGRACION-IA.md` |

Los documentos de hallazgos conservan las reproducciones de la candidata anterior para explicar el problema. El estado final de las correcciones y las comprobaciones realizadas se recoge en `CIERRE-V2.md` y en las evidencias de los ZIP. Las oportunidades futuras no se presentan como funciones ya desarrolladas.
