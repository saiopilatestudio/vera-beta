# Reparación de conexión IA en VERA 2.1

Comprobación real del 22/11/2026, con claves del propietario guardadas fuera del código. No se usaron datos personales ni se crearon cuentas de producción.

- Gemini Argon devolvió HTTP 429: la respuesta identificó una cuota gratuita de cero para ese modelo. El modelo avanzado predeterminado pasa a Gemini 4 Hydrogen, ensayado con éxito; no es un cambio automático de proveedor.
- Gemini Hydrogen devolvió un HTTP 503 por alta demanda durante el diagnóstico. Se añade un único reintento de esa respuesta explícita, dentro del plazo original, y un error de saturación comprensible si persiste. No se reintenta HTTP 429, respuestas ya completadas ni errores de red ambiguos.
- Se utiliza el enum canónico `LOW` para la configuración de razonamiento de Gemini.
- La generación de voz con Gemini 3.8 Flash-Lite TTS produce WAV válido: prueba corta de 147868 bytes y párrafo de 929308 bytes. El contrato de voz de servidor se conserva. La prueba no acredita reproducción en Android.
- Conversación avanzada y texto por la ruta de visión funcionaron con Hydrogen (17,1 y 23,0 s). Una imagen sintética del diario se transcribió correctamente: fecha 21/11/2026, bicicleta 20 minutos y sueño 8 horas. No acredita identificación de una máquina o gimnasio real sin datos verificables.

La configuración presente de una clave no garantiza cuota disponible ni ausencia de saturación. No se incorporan claves a APK, fuente ni manual. Toda inferencia sigue en Groq/Gemini.

Pruebas automatizadas del adaptador: 19 correctas. Pruebas HTTP/SQLite con transporte IA simulado: 13 grupos correctos. Las evidencias de proveedores reales se guardan aparte en `PROVEEDORES-REALES.json` y `VISION-REAL.json`.

Fuentes oficiales consultadas:
- [Modelos Gemini](https://aistudio.google.com/docs/models)
- [Gemini 4 Hydrogen](https://aistudio.google.com/docs/models/gemini-4-hydrogen)
- [Generación de voz](https://aistudio.google.com/docs/speech-generation)

La documentación de voz distingue WAV completo en solicitudes normales y PCM en streaming. VERA pide WAV completo, valida cabecera/formato y no usa síntesis local.
