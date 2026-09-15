import { snakeCase, varchar } from 'drizzle-orm/pg-core'

export const devices = snakeCase.table('devices', {
  /**  `device_id` from discovery event*/
  id: varchar({ length: 100 }).primaryKey(),
})
