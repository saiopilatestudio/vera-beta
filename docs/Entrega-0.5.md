# Vera 0.5 para Android
Descarga el APK desde Android, abre el archivo y pulsa Instalar. Se instala junto a la versión anterior con el identificador app.vera.coach.preview. Conserva la versión anterior si necesitas sus registros locales. La nueva instalación tiene un espacio de datos propio.

El APK incluye los pesos de Qwen 2.5 0.5B y Swin Food-101. La consulta local utiliza memoria y CPU del teléfono. El tiempo hasta la primera respuesta varía según el equipo. Los resultados visuales son propuestas que se deben revisar.

## Compilar desde el código
Descomprime el ZIP. Desde su raíz ejecuta bash scripts/recover-models.sh para recuperar los mismos pesos y comprobar sus SHA-256, o extrae assets/coach.gguf y assets/food.onnx del APK dentro de www. Este paso se realiza al construir. El usuario instala un único APK.

El proyecto beta usa beta-android/build.sh. Indica BUILDTOOLS, ANDROID_JAR y ECJ con las rutas a las herramientas de Android, plataforma API 35 y compilador Eclipse. BETA_KEYSTORE y BETA_PASS deben corresponder a tu almacén de firma. APK_OUTPUT designa el archivo final. La clave privada de la firma se conserva fuera del código.

## Servidor
El cliente tiene preconfigurado https://vera-beta.onrender.com. Para reconstruir el servicio web usa Node 24, npm ci --omit=dev y node server.mjs. Conserva los secretos de la instancia existente y su conexión a Turso al desplegar. El registro abierto es el predeterminado. Para un despliegue privado configura VERA_REGISTRATION_MODE=invite y VERA_INVITE. El modelo del servidor requiere una clave de proveedor. La descarga del APK no despliega cambios en Render.
