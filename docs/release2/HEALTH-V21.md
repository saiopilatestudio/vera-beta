# Salud conectada en VERA 2.1

La APK integra Health Connect del sistema en Android 14 o posterior. Lee pasos del día y hasta 28 días de sesiones, sueño, peso y nutrición accesibles por los permisos concedidos. Los nutrientes se conservan sólo cuando existen: energía en kcal; proteínas, hidratos, grasa y fibra en gramos; minerales en mg; vitaminas D/B12 en µg. El peso importado se etiqueta «Otro pesaje», sin asumir ayuno.

En el primer inicio de sesión aparece la autorización del sistema. Android exige que la persona elija los permisos; VERA no puede concedérselos. Después se refresca al volver a la app, cada cinco minutos mientras está visible y después de guardar datos con una espera de 15 segundos. No repite peticiones de permiso automáticamente tras una denegación. «Datos de salud» permite revisarlos. No se ejecuta un servicio continuo cuando la aplicación está cerrada.

Cada lectura queda ligada a la cuenta que la solicitó y tiene plazo de validez. Los resultados de otra sesión se descartan. Las identidades de los registros son estables, las instantáneas sustituyen sólo su tipo y ventana, y una actualización idéntica no guarda ni vuelve a disparar sincronización. Los intervalos superpuestos de sueño se unen y se descuentan los intervalos de vigilia.

Google Fit puede aportar datos si su integración con Health Connect los publica en el dispositivo. VERA no implementa un inicio de sesión OAuth de Google Fit ni promete que un dato no compartido esté disponible. Google recomienda Health Connect para nuevas aplicaciones móviles Android tras la retirada de las APIs Fit. Las claves Gemini no autorizan acceso a Fit o a Health Connect.

Verificado: compilación de las clases nativas con API 35; pruebas de identidad, reemplazo sin duplicados, aislamiento entre cuentas, guardia de solicitudes simultáneas, ausencia de guardados repetidos, solapamiento de sueño y peso. Pendiente: prueba en dispositivo físico de cada permiso y fuente de datos.

Fuentes oficiales:
- [Plataforma Google Fit y migración](https://developers.google.com/fit/overview/)
- [NutritionRecord, unidades y campos opcionales](https://developer.android.com/reference/android/health/connect/datatypes/NutritionRecord)
- [Permisos e integración de Health Connect](https://developer.android.com/codelabs/health-connect)
