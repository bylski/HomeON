import { defineConfig } from 'drizzle-kit'
import './src/envConfig'
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './drizzle',
  dbCredentials: {
    host: process.env.POSTGRES_HOST!,
    port: +(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: 'device-ingest',
    ssl: false,
  },
})
