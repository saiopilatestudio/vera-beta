# Panel de Vera Performance 1.0.3

En local, instala Node 24, ejecuta npm ci y npm start en la carpeta del repositorio y abre http://localhost:8080/admin. Para Render conserva TURSO_DATABASE_URL y TURSO_AUTH_TOKEN. Configura VERA_OWNER_EMAIL como saiopilatestudio@gmail.com y crea en Render VERA_OWNER_PASSWORD con al menos 16 caracteres. El correo por sí solo no concede acceso.

| Perfil | Variables | Acceso |
|---|---|---|
| Propietario | VERA_OWNER_EMAIL y VERA_OWNER_PASSWORD | Resumen, catálogo, prospección y operaciones |
| Editor | VERA_EDITOR_EMAIL y VERA_EDITOR_PASSWORD | Resumen y edición del catálogo |
| Analista | VERA_ANALYST_EMAIL y VERA_ANALYST_PASSWORD | Contadores de actividad y series semanales |

El gráfico cuenta solicitudes registradas, no usuarios únicos. Las salas se agregan por estado sin mostrar participantes. La presencia de claves en el indicador de configuración no demuestra que el proveedor responda. El catálogo exporta fichas técnicas documentadas. La búsqueda de empresas requiere una clave de OpenAI configurada y puede consumir cuota.

El formulario web inicia una sesión de 30 minutos con cookie HttpOnly y protección CSRF. En Render la cookie requiere HTTPS. Cerrar sesión la invalida. Los secretos se configuran fuera del código. Una reinstancia del servidor cierra las sesiones de administración.
