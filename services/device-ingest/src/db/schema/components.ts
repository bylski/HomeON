import { integer, snakeCase, unique, varchar } from 'drizzle-orm/pg-core'
import { devices } from './devices'
import { COMPONENT_TYPES } from '../../contract/events'

export const components = snakeCase.table(
  'components',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** component ids can possibly overlap between devices */
    componentId: varchar({ length: 100 }).notNull(),
    deviceId: varchar({ length: 100 })
      .notNull()
      .references(() => devices.id, { onDelete: 'cascade' }),

    name: varchar({ length: 100 }).notNull(),
    type: varchar({
      enum: COMPONENT_TYPES,
    }).notNull(),
  },
  (table) => [unique('components_device_component_unique').on(table.deviceId, table.componentId)],
)

export type Component = typeof components.$inferSelect
export type NewComponent = typeof components.$inferInsert
