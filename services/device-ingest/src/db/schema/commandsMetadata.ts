import { foreignKey, integer, numeric, snakeCase, text, unique, varchar } from 'drizzle-orm/pg-core'
import { devices } from './devices'
import { components } from './components'

export const commandsMetadata = snakeCase.table(
  'commands_metadata',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    componentId: varchar({ length: 100 }).notNull(),
    deviceId: varchar({ length: 100 }).notNull(),

    command: varchar({ length: 100 }).notNull(),
    commandTopic: varchar({ length: 100 }).notNull(),

    allowedValues: varchar({ length: 50 }).array(),
    minValue: numeric(),
    maxValue: numeric(),
    description: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.deviceId, table.componentId],
      foreignColumns: [components.deviceId, components.componentId],
    }).onDelete('cascade'),
  ],
)

export type CommandMetadata = typeof commandsMetadata.$inferSelect
export type NewCommandMetadata = typeof commandsMetadata.$inferInsert
