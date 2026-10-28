import path from 'node:path'
import drizzle, { migrate } from '@home-on/drizzle'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { GenericContainer } from 'testcontainers'
import type { TestProject } from 'vitest/node'
import { relations } from '../../src/db/relations/index.js'

// mosquitto 2 only accepts local connections unless a listener is configured
const MOSQUITTO_CONF = 'listener 1883\nallow_anonymous true\n'

/** Starts Postgres and Mosquitto once per run and hands their addresses to the test workers. */
export default async (project: TestProject) => {
  const [postgres, mosquitto] = await Promise.all([
    new PostgreSqlContainer('postgres:17-alpine').withDatabase('device-ingest').start(),
    new GenericContainer('eclipse-mosquitto:2')
      .withCopyContentToContainer([
        { content: MOSQUITTO_CONF, target: '/mosquitto/config/mosquitto.conf' },
      ])
      .withExposedPorts(1883)
      .start(),
  ])

  const testEnv = {
    POSTGRES_HOST: postgres.getHost(),
    POSTGRES_PORT: String(postgres.getPort()),
    POSTGRES_USER: postgres.getUsername(),
    POSTGRES_PASSWORD: postgres.getPassword(),
    ENV_MQTT_HOST: mosquitto.getHost(),
    ENV_MQTT_PORT: String(mosquitto.getMappedPort(1883)),
    ENV_MQTT_USERNAME: 'test',
    ENV_MQTT_PASSWORD: 'test',
  }

  // the db factory reads its connection from process.env
  Object.assign(process.env, testEnv)
  const db = drizzle('device-ingest', relations)
  await migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, '../../drizzle') })
  await db.$client.end()

  project.provide('testEnv', testEnv)

  return async () => {
    await Promise.all([postgres.stop(), mosquitto.stop()])
  }
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation only works with interfaces
  export interface ProvidedContext {
    testEnv: Record<string, string>
  }
}
