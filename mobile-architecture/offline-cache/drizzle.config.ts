import type { Config } from 'drizzle-kit';

// Migrations versionadas no cliente são o preço de ter banco local como SSOT:
// o schema evolui junto com o app e precisa migrar no dispositivo do usuário.
export default {
  schema: './src/data/local/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
