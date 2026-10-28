import { beforeEach, inject } from 'vitest'

// must run before any src module is imported: the db and MQTT client read process.env on import
Object.assign(process.env, inject('testEnv'))

const { default: db } = await import('../../src/db/index.js')
const { sql } = await import('@home-on/drizzle')

// every test starts from an empty database; the migrations journal lives in its own schema
beforeEach(async () => {
  const { rows } = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  )
  if (!rows.length) {
    return
  }
  const tables = sql.join(
    rows.map(({ tablename }) => sql.identifier(tablename)),
    sql`, `,
  )
  await db.execute(sql`truncate ${tables} restart identity cascade`)
})
