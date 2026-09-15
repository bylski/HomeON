import { drizzle } from 'drizzle-orm/node-postgres'

const db = drizzle({
  connection: {
    host: process.env.POSTGRES_HOST,
    port: +(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: 'device-ingest',
  },
})

export default db
