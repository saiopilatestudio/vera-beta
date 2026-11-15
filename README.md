# Vera Performance 1.0.3 beta
El contenido de esta carpeta es el proyecto para GitHub, incluida .github. El ZIP incluye aparte INICIO-WINDOWS.txt y RECONSTRUIR.cmd. Los tres modelos locales se recuperan de la APK con los comandos de INICIO-WINDOWS.txt. En Linux también puedes usar sh scripts/restore-models.sh.

Con Node 24 ejecuta npm ci, npm test y npm start. Abre http://localhost:8080 y http://localhost:8080/admin. Encontrarás la configuración del propietario en docs/release103/README_ADMIN.md. En Render conserva la conexión a tu base actual y usa los comandos de render.yaml. Los secretos pertenecen a Render o a GitHub Actions.

Android: instalación limpia con la nueva firma. Consulta docs/release103/README_ANDROID_UPGRADE.md.
