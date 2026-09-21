import { foreignKey, integer, numeric, snakeCase, unique, varchar } from '@home-on/drizzle'
import { components } from './components'

export const metricsMetadata = snakeCase.table(
  'metrics_metadata',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    metricId: varchar({ length: 100 }).notNull(),
    componentId: varchar({ length: 100 }).notNull(),
    deviceId: varchar({ length: 100 }).notNull(),

    name: varchar({ length: 100 }).notNull(),
    metric: varchar({ length: 100 }).notNull(),
    unit: varchar({ length: 50 }).notNull(),
    minValue: numeric(),
    maxValue: numeric(),
  },
  (table) => [
    unique('metrics_metadata_metric_component_device_uniq').on(
      table.deviceId,
      table.componentId,
      table.metricId,
    ),
    foreignKey({
      columns: [table.deviceId, table.componentId],
      foreignColumns: [components.deviceId, components.componentId],
    }).onDelete('cascade'),
  ],
)

export type MetricMetadata = typeof metricsMetadata.$inferSelect
export type NewMetricMetadata = typeof metricsMetadata.$inferInsert
