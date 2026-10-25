import {
  getColumns,
  sql,
  type AnyRelations,
  type BuildQueryResult,
  type DBQueryConfigWith,
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

/** `with` clause accepted by `db.query[TTable]`, e.g. `{ components: true }`. */
export type DbQueryWith<
  TRelations extends AnyRelations,
  TTable extends keyof TRelations,
> = DBQueryConfigWith<TRelations, TRelations[TTable]['relations']>

/** Row shape returned by `db.query[TTable].findMany`/`findFirst` for a given `with` clause. */
export type DbQueryResult<
  TRelations extends AnyRelations,
  TTable extends keyof TRelations,
  TWith extends DbQueryWith<TRelations, TTable> = Record<never, never>,
> = BuildQueryResult<TRelations, TRelations[TTable], { with: TWith }>

export const prepareUpdateOnConflictSet = <
  TTable extends PgTable,
  TKeyFlags extends Record<keyof TTable['_']['columns'], boolean>,
>(
  table: TTable,
  row: TKeyFlags,
) => {
  const columns = getColumns(table)
  const set = {} as Record<keyof TKeyFlags, SQL>
  for (const [key, shouldApply] of Object.entries(row)) {
    // set only needed fields and discard primary keys
    if (!shouldApply || columns[key as keyof typeof columns].primary) {
      continue
    }
    set[key as keyof typeof set] = sql`excluded.${sql.identifier(toSnakeCase(key))}`
  }
  return set
}

export * from 'drizzle-orm'
export * from 'drizzle-orm/pg-core'

// resolve conflicts between 'drizzle-orm' and 'drizzle-orm/pg-core' exports
export type { SelectedFields } from 'drizzle-orm/pg-core'
export type { SelectedFieldsFlat } from 'drizzle-orm/pg-core'
export type { SelectedFieldsOrdered } from 'drizzle-orm/pg-core'
export type { TableConfig } from 'drizzle-orm/pg-core'
