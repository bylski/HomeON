import type { DbQueryResult, DbQueryWith } from '@home-on/drizzle'
import type { relations } from './relations/index.js'

type Relations = typeof relations

/** {@link DbQueryWith} bound to this service's relations. */
export type QueryWith<TTable extends keyof Relations> = DbQueryWith<Relations, TTable>

/** {@link DbQueryResult} bound to this service's relations. */
export type QueryResult<
  TTable extends keyof Relations,
  TWith extends QueryWith<TTable> = {},
> = DbQueryResult<Relations, TTable, TWith>
