# Investigación competitiva y voz del usuario — VERA Performance
**Fecha de consulta:** 15 de noviembre de 2026. **Fuente y alcance:** fichas y reseñas públicas visibles de App Store / Google Play; publicaciones de Reddit como foro y red social; documentación oficial de OpenAI, Anthropic, Android y Google Health. No se tuvo acceso completo a posts privados, comentarios bloqueados, redes con acceso restringido ni APK VERA Performance 1.0.2 instalada. La muestra no es representativa de todas las personas que entrenan.

## Resumen ejecutivo
VERA debería combinar el diario ultrarrápido y confiable de Hevy/Strong, adaptación verificable de Fitbod, biblioteca de Boostcamp, análisis de comidas conveniente de Foodvisor y trazabilidad de nutrición de Cronometer, **sin sus defectos más mencionados**: bloqueo durante sesiones, sync duplicada o pérdida de datos, búsqueda pobre, base alimentaria incompleta, falsas identificaciones de IA y pagos interruptivos. Diferenciadores propuestos para VERA: diálogo que crea y corrige registros reales, visión multimodal de **Life Fitness** con placa y QR, comida española con porciones editables, marca exacta de suplementos, identidad visual lima y panel administrador con evaluación de IA y transparencia de coste.

## Evidencia de App Store
| Producto / enlace | Hallazgo visible | Problema / mejora propuesta para VERA |
|---|---|---|
| [Hevy iOS ficha](https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350) | Presenta logging de set, peso/reps/RPE, temporizadores, PR, gráficos, warm-ups, dropsets, offline y sincronización | Núcleo de fuerza debe funcionar sin depender del LLM ni de la red |
| [Hevy iOS reseñas](https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350?platform=iphone&see-all=reviews) | Personas valoran simplicidad, videos y sustituciones; reseña pide cambio entre objetivo fuerza/hipertrofia | Separar objetivo de adaptación y hacerlo editable; no inundar con formularios |
| [Strong iOS reseñas](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577?platform=iphone&see-all=reviews) | Reseñas señalan freezes al volver del temporizador, fallos de Apple Watch sync, typos en búsqueda, dificultades en plantillas/notas | Autosave, background timer basado en tiempo real, búsqueda fuzzy, historial/notas independientes de plantilla |
| [Foodvisor iOS ficha](https://apps.apple.com/us/app/foodvisor-ai-calorie-counter/id1064020872) | Fotografía, voz, búsqueda, barcode, favoritos, seguimiento macros y progreso | Multimodal de baja fricción con corrección; alternativas manuales ante errores |
| [Foodvisor iOS reseñas](https://apps.apple.com/us/app/foodvisor-ai-calorie-counter/id1064020872?platform=iphone&see-all=reviews) | Reseña reciente reconoce falta de algunos alimentos y necesidad de añadirlos | Dar capacidad de corregir/crear plato y fuente, no escoger genérico incorrecto |

## Evidencia de Google Play
| Producto / enlace | Hallazgo visible | Cambio propuesto para VERA |
|---|---|---|
| [Hevy Android](https://play.google.com/store/apps/details?id=com.hevy&hl=es) | Reseña del 28/04/2026 denuncia pérdida de conexión Health Connect; otras piden avance por ejercicio entre rutinas | Sync resiliente, historial por ejercicio, permisos claros; test repetido de importación |
| [Strong Android](https://play.google.com/store/apps/details?id=io.strongapp.strong&hl=es) | Reseñas desean catálogo más completo, idioma ES consistente y filtros por ejercicio e implemento (agarres) | Máquina/agarre, alias de búsqueda y ES/EN, favoritos y PR por ejercicio |
| [Fitbod Android](https://play.google.com/store/apps/details?id=com.fitbod.fitbod&hl=es) | Promueve rutinas por equipo; reseñas del 2026 mencionan conectividad reloj/teléfono y problemas al entrar en cuentas con rutinas | Evitar planes que ignoren el gimnasio, proteger identidad/almacenamiento y sync |
| [Boostcamp Android](https://play.google.com/store/apps/details?id=com.bpmhealth.boostcamp&hl=es) | Biblioteca de programas; reseña 25/04/2026 describe lag y timer/sesión que se reinician | No dejar que UI pesada o IA interrumpa entreno; recuperación de estado |
| [Cronometer Android](https://play.google.com/store/apps/details?id=com.cronometer.android.gold&hl=es) | Enfoca nutrición en datos verificados y micronutrientes | Anclar macros a tablas con fuentes, no inferencia de LLM sin fundamento |
| [Foodvisor Android](https://play.google.com/store/apps/details?id=io.foodvisor.foodvisor&hl=es) | Reseña 10/03/2026 pide alguna foto gratis y opción de `merienda` | No bloquear funcionalidades básicas por plan de pago y adaptar vocabulario regional |
| [StrongLifts Android](https://play.google.com/store/apps/details?id=com.stronglifts.app) | Reseñas 2026 reclaman suscripciones intrusivas y pérdida de prestaciones antes compradas | Monetización transparente, sin popups no descartables tras sets y respeto a derechos adquiridos |
| [MyFitnessPal Android](https://play.google.com/store/apps/details?id=com.myfitnesspal.android) | Amplitud de registro, datos alimentarios y modelo de suscripción | Contrastar base alimentaria, marketing no sustituye exactitud |

## Evidencia de Reddit / comunidades sociales
| Debate | Fecha | Voz del usuario y consecuencia |
|---|---|---|
| [Hevy: notas globales por ejercicio](https://www.reddit.com/r/Hevy/comments/1vxpnm6/global_notes/) | 25/08/2026 | Reclaman instrucciones de setup persistentes entre rutinas; implementar `exercise_notes` por usuario/ejercicio y plantilla |
| [Hevy: fusionar histórico de ejercicio personalizado y oficial](https://www.reddit.com/r/Hevy/comments/1vgzh3i/feature_request_merge_custom_exercise_history/) | 06/08/2026 | Cambiar de ejercicio no debería fragmentar PR/volumen; implementar `aliases` y migración de IDs reversible |
| [Hevy: product updates](https://www.reddit.com/r/Hevy/comments/1x5m1su/all_hevy_product_updates/) | 14/10/2026 y hasta nov 2026 | Mejoras en notas, deload, trainer y conexión de producto con ChatGPT; competencia se mueve hacia IA útil conectada a datos |
| [Fitbod: incidencias reconocidas](https://www.reddit.com/r/fitbod/comments/1qoq4lp/recent_issues_now_resolved/) | 27/01/2026 | Equipo informa fallos de generación de splits y grupos musculares; añadir validador determinista de planes |
| [Fitbod: syncing y correcciones](https://www.reddit.com/r/fitbod/comments/1t7bndn/what_weve_fixed_whats_next/) | 08/05/2026 | Admiten sync duplicada Health y errores permisos/calorías; test multi-dispositivo y logs idempotentes |
| [Fitbod: opinión de coach IA](https://www.reddit.com/r/fitbod/comments/1vo40yk/ai_coach/) | 14/08/2026 | Interesa explicación de por qué elige cargas/reps, y se reportan cambios inesperados de disponibilidad de beta; explicar recomendaciones y feature flags consistentes |
| [Hevy: mejoras y estadísticas 2025](https://www.reddit.com/r/Hevy/comments/1q6e2fx/2025_hevy_recap_update/) | 07/01/2026 | Calendario, warmup separado de volumen, RPE y fuerza, exportación a Health Connect; definiciones consistentes de métricas |

### Redes sociales fuera de Reddit
La búsqueda pública de Instagram/TikTok/YouTube no proporcionó aquí un conjunto reproducible suficiente de testimonios directos verificados; no presentar números ni comentarios atribuidos a esas plataformas. En Codex, si hay acceso y cumplimiento de términos, incorporar fuentes públicas verificables con URL/fecha, y formular una encuesta opt-in de VERA sobre problemas del entrenamiento. Evitar scraping no autorizado y recolección de perfiles personales.

## Comparación honesta con VERA
La descripción funcional de **VERA Performance 1.0.2 beta** procede del proyecto del propietario; se han comunicado: interfaz Performance lima, reconocimiento de máquinas por vista y placa/QR, comida con ajuste de raciones, login con biometría, IA, monitorización y panel web. **Esto describe funciones solicitadas/reportadas, no pruebas independientes de funcionamiento en la APK 1.0.2**. La única revisión estática de fuente realizada aquí corresponde al repo histórico `saiopilatestudio/vera-beta` cuyo `package.json` declara `0.3.0-beta.1`. En particular se detectan dos IDs Android distintos: `app.vera.coach` (Capacitor Gradle) y `app.vera.coach.beta` (beta-android), sin prueba del ID de la 1.0.2 real.

| Área | Referente | VERA 1.0.2 (estado que debe comprobar Codex) | Gap / trabajo |
|---|---|---|---|
| Registrar series y RIR | Hevy, Strong | No validado con APK | Autosave en cada set, timer durable, UX 2–3 toques |
| Planes adaptados | Fitbod, Boostcamp | Solicitud del proyecto, no test | Validación de split/volumen/recuperación/maquinaria |
| Historial continuo | Hevy/Strong | No validado | Merge por ID, PR/historial en todas las rutinas |
| IA con acción | Fitbod AI coach + chat avanzado | Backend antiguo llama OpenAI; 1.0.2 no verificado | Tool calling, DB transaccional, coste controlado |
| Foto comida | Foodvisor, Cronometer | Problemas reportados de confusión (mollete/tortitas) | Clasificación, fuente nutricional, gramos editables y revisión |
| Máquina Life Fitness | Función diferenciadora VERA | Reportado 2 fotos/QR; no test físico real | OCR placa, fuentes oficiales, validación y abstención |
| Suplementos exactos | Catálogos oficiales | Errores reportados de marca y gramaje | OCR etiqueta, marca+SKU+variante, buscador real |
| Health Connect | Hevy/Fitbod | Integración deseada, calidad no medida | Conectividad real, dedup y permiso mínimo |
| Admin | Panel propio | Repo antiguo `admin.html` mínimo | Nuevo dashboard de usuarios/metadatos, IA, content, ads y auditoría |
| Actualización APK | Guías oficiales Android | ID y firma 1.0.2 desconocidos | Mantener paquete + certificado + versionCode mayor, prueba con `adb install -r` |

## Documentación técnica y límites legales
- Requisitos Play para actualizar la app: https://support.google.com/googleplay/android-developer/answer/9859350
- Android app signing: https://developer.android.com/studio/publish/app-signing
- OpenAI Responses API: https://developers.openai.com/api/reference/responses/overview
- OpenAI tool calling: https://developers.openai.com/api/docs/guides/function-calling
- OpenAI imágenes/visión y limitaciones: https://developers.openai.com/api/docs/guides/images-vision
- Anthropic Claude vision: https://platform.claude.com/docs/en/build-with-claude/vision
- Anthropic strict/structured: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Google Health API policy (vigente 24/03/2026) **prohíbe venta a terceros incluso datos agregados/anónimos obtenidos de estas APIs**: https://developers.google.com/health/policies/health-api-developer-user-data-policy
- Health Connect Play policy: https://support.google.com/googleplay/android-developer/answer/18265346
- USDA FoodData Central: https://fdc.nal.usda.gov/api-guide/
- Open Food Facts API: https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/

## Puntuación propuesta (hipótesis para validación)
Ponderación para roadmap = impacto de fallo 40%, frecuencia de uso 25%, diferencial 15%, complejidad/viabilidad 10%, cumplimiento 10%. Aplíquese con pruebas de usuario e instrumentos reales, no ranking inventado. El orden inicial recomendado es: **preservación/upgrade y fiabilidad de diario**, **acciones IA y foto**, **login/sync**, **catálogos**, **admin**, **monetización con legalidad**.
