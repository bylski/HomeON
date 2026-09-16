import { foreignKey, integer, numeric, snakeCase, unique, varchar } from 'drizzle-orm/pg-core'
import { components } from './components'
import { devices } from './devices'

export const metricsMetadata = snakeCase.table(
  'metrics_metadata',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    componentId: varchar({ length: 100 }).notNull().notNull(),
    deviceId: varchar({ length: 100 }).notNull().notNull(),

    metric: varchar({ length: 100 }),
    unit: varchar({ length: 50 }).notNull(),
    minValue: numeric(),
    maxValue: numeric(),
  },
  (table) => [
    foreignKey({
      columns: [table.deviceId, table.componentId],
      foreignColumns: [components.deviceId, components.componentId],
    }).onDelete('cascade'),
  ],
)

export type MetricMetadata = typeof metricsMetadata.$inferSelect
export type NewMetricMetadata = typeof metricsMetadata.$inferInsert
