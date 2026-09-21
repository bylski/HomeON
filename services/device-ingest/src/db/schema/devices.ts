import { snakeCase, varchar } from '@home-on/drizzle'

export const devices = snakeCase.table('devices', {
  /**  `device_id` from discovery event*/
  id: varchar({ length: 100 }).primaryKey(),
  name: varchar({ length: 100 }).notNull(),
})

export type Device = typeof devices.$inferSelect
export type NewDevice = typeof devices.$inferInsert
