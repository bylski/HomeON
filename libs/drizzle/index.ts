import {
  getColumns,
  sql,
  type AnyRelations,
  type ExtractTablesWithRelations,
  type Schema,
  type SQL,
} from 'drizzle-orm'
import { toSnakeCase } from 'drizzle-orm/casing'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { PgTable } from 'drizzle-orm/pg-core'

export default <TRelations extends AnyRelations>(dbName: string, relations: TRelations) =>
  drizzle({
    connection: {
      host: process.env.POSTGRES_HOST,
      port: +(process.env.POSTGRES_PORT ?? 5432),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: dbName,
    },
    relations,
  })

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
