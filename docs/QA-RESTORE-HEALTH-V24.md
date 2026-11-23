# QA de guardado y restauración de salud — V2.4

Prueba `tests/journal-health-restore-http24.mjs`: servidor HTTP real local, SQLite aislada, registro/login/logout reales, código `www/journal.js` de producción ejecutado en VM. Sin cuentas reales ni llamadas a Google/Fit/Health Connect.

Se guardan 63 registros para cubrir paginación: cardio bici con origen Google Fit, natación con distancia/calorías desconocidas conservadas como null, sueño, pasos, agua, nutrición/micronutrientes, peso y registros manuales. Tras logout se verifica token revocado y un login nuevo recupera todos los registros desde un cliente vacío, además de perfil, apodo y objetivo de sueño. Reimportar el mismoID no duplica; cambiar distancia actualiza; borrar conserva tombstone y no resucita al restaurar; otra cuenta no ve nada.

Defecto corregido en `www/journal.js`: Map ocultaba copias locales con mismoID pero el array visual mantenía duplicados. Ahora copias idénticas se consolidan al sincronizar y cuentan como pendientes hasta quedar consolidadas. Dos contenidos incompatibles con el mismoID se conservan y detienen el envío con explicación, sin elegir silenciosamente uno. No se modificó el backend ni Health Connect porque los casos probados conservaron correctamente los campos.

Regresión `tests/online22.mjs`: 10/10, incluyendo entrada de bici mientras otro lote está en vuelo, cambios de cuenta durante ACK, restauración y conexión interrumpida.

## Android disponible en el equipo

Revisión de disponibilidad, sin instalar nada:

- ADB existente: `C:/Users/tekph/Documents/ChatGPT/Chat tor multiagente/.build-tools/sdk/platform-tools/adb.exe`.
- `adb devices -l`: lista vacía. La consulta inició el daemon ADB estándar; no instaló ni ejecutó ninguna APK.
- Ese SDK contiene platform-tools/build-tools/platforms, pero no emulator ni system-images. No se encontró AVD en `.android/avd` ni proceso emulator/qemu.
- CIM Win32_Processor informa `VirtualizationFirmwareEnabled=False` y `SecondLevelAddressTranslationExtensions=False`. Esto describe lo expuesto al sistema actual, no demuestra que el hardware físico sea incapaz; habría que revisar firmware/hipervisor antes de preparar un emulador acelerado.

Alternativas prácticas: teléfono Android14+ propio conectado porUSB y autorizado para depuración; o preparar posteriormente Android Emulator oficial con imagen licenciada deGoogle, virtualización y WHPX. No se propone una imagen obtenida de terceros. Para pruebas reproducibles, Google ofrece Health Connect Toolbox, que inserta y consulta registros sintéticos: https://developer.android.com/health-and-fitness/health-connect/test/health-connect-toolbox . Casos oficiales: https://developer.android.com/health-and-fitness/health-connect/test/test-cases . Requisitos de aceleración Windows: https://developer.android.com/studio/run/emulator-acceleration .

La persistencia queda comprobada con datos sintéticos representativos; aún no se ha observado un ciclo real Google Fit→Health Connect→APK en un dispositivo conectado.
