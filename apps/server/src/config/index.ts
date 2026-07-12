// ─── Server Configuration ─────────────────────────────────────

export const config = {
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  host: process.env['HOST'] ?? '0.0.0.0',

  database: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://scribble:scribble_dev@localhost:5432/scribble?schema=public',
  },

  jwt: {
    secret: process.env['JWT_SECRET'] ?? 'scribble-dev-secret-change-me',
  },

  cors: {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
  },
} as const;
