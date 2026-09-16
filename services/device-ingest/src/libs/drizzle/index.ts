import { getColumns, sql, type Columns, type SQL, type TableConfig } from 'drizzle-orm'
import { toSnakeCase } from 'drizzle-orm/casing'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { PgTable } from 'drizzle-orm/pg-core'
import { relations } from '../../db/relations'

const db = drizzle({
  connection: {
    host: process.env.POSTGRES_HOST,
    port: +(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: 'device-ingest',
  },
  relations,
})

export default db

export const prepareUpdateOnConflictSet = <
  TTable extends PgTable,
  TKeyFlags extends Record<keyof TTable['_']['columns'], boolean>,
>(
  table: TTable,
  row: TKeyFlags,
) => {
  const columns = getColumns(table)
  const set: Record<keyof TKeyFlags, SQL> = {} as any
  for (const [key, shouldApply] of Object.entries(row)) {
    // set only needed fields and discard primary keys
    if (!shouldApply || columns[key as keyof typeof columns].primary) {
      continue
    }
    set[key as keyof typeof set] = sql`excluded.${sql.identifier(toSnakeCase(key))}`
  }
  return set
}
