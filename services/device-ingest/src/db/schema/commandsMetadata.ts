import { foreignKey, integer, numeric, snakeCase, text, unique, varchar } from '@home-on/drizzle'
import { components } from './components.js'

export const commandsMetadata = snakeCase.table(
  'commands_metadata',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    commandId: varchar({ length: 100 }).notNull(),
    componentId: varchar({ length: 100 }).notNull(),
    deviceId: varchar({ length: 100 }).notNull(),

    name: varchar({ length: 100 }).notNull(),
    command: varchar({ length: 100 }).notNull(),
    commandTopic: varchar({ length: 100 }).notNull(),

    allowedValues: varchar({ length: 50 }).array(),
    minValue: numeric(),
    maxValue: numeric(),
    description: text(),
  },
  (table) => [
    unique('commands_metadata_command_component_device_uniq').on(
      table.deviceId,
      table.componentId,
      table.commandId,
    ),
    foreignKey({
      columns: [table.deviceId, table.componentId],
      foreignColumns: [components.deviceId, components.componentId],
    }).onDelete('cascade'),
  ],
)

export type CommandMetadata = typeof commandsMetadata.$inferSelect
export type NewCommandMetadata = typeof commandsMetadata.$inferInsert
