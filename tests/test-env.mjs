// Legacy regression tests must never inherit a production database or admin file.
Object.assign(process.env, {
  TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '', RENDER: '',
  VERA_ALLOW_LEGACY_OWNER_FILE: '',
});
