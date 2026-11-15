# README ANDROID UPGRADE

El APK distribuido 1.0.2 tiene SHA-256 f044ef9a221939c792d5b30504207c39309c712c0a06f4ecfd07bb81415c8778. El archivo de fuentes tiene SHA-256 e29f3e2654f9100d144549b185553f55a334af06b7179d35f8c489e76c36bd24. Todos sus recursos web presentes coinciden con assets/ de la APK. No hay SHA Git histórico atestado. La rama local parte del commit de importación ff329a1.

Package app.vera.coach.visionbeta, origen https://localhost, versión 12 → 13. Huella del certificado 54fc449c3399b2facb0f556024361e2d02653c938196bc046a9b71b1bb228786. Recuperar el keystore original en CI mediante VERA_KEYSTORE_BASE64 y VERA_KEYSTORE_PASSWORD. El workflow comprueba la huella, identidad y recursos. Para aprobar, exportar respaldo, instalar 1.0.2 en Android de prueba, generar diario sintético, ejecutar adb install -r y cotejar cuenta, historial, sesión y fotos. Repetir sin conexión. Está pendiente la prueba en dispositivo.
