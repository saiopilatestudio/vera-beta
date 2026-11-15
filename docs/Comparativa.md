# Vera vs. competencia — investigación de funciones (13 nov 2026)

| Competidor | Función contrastada | Mejora / prioridad para Vera |
|---|---|---|
| Hevy | RPE, series, carga, superseries, calculadora de calentamiento, volumen y gráficos musculares | **Alta:** registro por serie sin fricción; completar en siguiente versión PRs y gráficos semanales por grupo muscular |
| Fitbod | Plan según objetivo, equipo, historial y recuperación estimada | **Alta:** usar historial de los últimos ejercicios y señales de fatiga, con ajustes manuales; nunca mostrar recuperación como una medida médica |
| MacroFactor | Tendencia de peso y ajuste de energía/macros mediante consumo y cambios de peso | **Media:** agregar media móvil, cobertura de comidas, comparar semanas y aplazar ajustes con datos incompletos |
| Foodvisor | Foto comida → ingredientes sugeridos → ración editable → confirmación | **Alta:** se preparó la ruta de visión remota de Plato y Chat; pendientes modelo visual offline y validación nutricional |
| MyFitnessPal | Escaneo de comidas y corrección de raciones con elección manual de alimentos | **Media:** menú de alimentos más reconocidos y búsqueda manual con base de datos contrastada |
| JEFIT | Precarga de la sesión anterior, temporizador, 1RM, récords y resúmenes | **Media:** precarga de pesos/reps y métricas por ejercicio; mejora de experiencia durante entrenamiento |

## Prioridades técnicas

**P0 — Estabilidad de producto:** integrar assets Android, generar build firmado con keystore original, comprobar que el modelo GGUF está realmente incluido, verificación de registro sin invitación y smoke tests APK+web.

**P1 — Información usable:** gráficos de tendencias y volumen (implementados en fuente), aportaciones de especialistas, reconocimiento remoto de platos/máquinas con confirmación, acceso rápido a cámara y galería, exportación de datos (implementados en fuente).

**P2 — Personalización real:** PRs, e1RM por ejercicio, RIR/RPE, progreso semanal por músculo, recuperación estimada y corregible, tendencia de peso robusta y seguimiento de adherencia (planificado; no implementado en este hotfix).

**P3 — Escalabilidad y privacidad:** sincronización cifrada web/apk con gestión de conflictos, límites de gasto por usuario y globales, verificación de email y prevención de fraude (planificado; no implementado).

## Fuentes oficiales consultadas

- Hevy: https://www.hevyapp.com/features/
- Fitbod: https://help.fitbod.me/hc/en-us/articles/43492170863895-How-does-Fitbod-know-my-muscles-are-still-recovering
- MacroFactor: https://help.macrofactorapp.com/dashboard/weight_trend/
- Foodvisor: https://foodvisor.zendesk.com/hc/en-us/articles/30631165940508-How-do-I-log-a-meal-eaten-out-restaurant-at-a-friend-s
- MyFitnessPal: https://support.myfitnesspal.com/hc/es/articles/360045761612-C%C3%B3mo-usar-el-Esc%C3%A1ner-de-Comidas
- JEFIT: https://www.je.fit/features/log-track
- Android WebView: https://developer.android.com/develop/ui/views/layout/webapps/load-local-content
- Qwen modelo: https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/tree/main
