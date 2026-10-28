import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { buildLogger } from '@home-on/logger/index'
import type { TestProject } from 'vitest/node'

const logger = buildLogger('[SYSTEM TESTS]')

const ROOT = path.resolve(import.meta.dirname, '../../..')
const COMPOSE = ['compose', '-p', 'homeon-system', '-f', 'compose.yml', '-f', 'compose.system.yml']

const compose = (...args: string[]) =>
  execFileSync('docker', [...COMPOSE, ...args], { cwd: ROOT, stdio: 'inherit' })

/** the host port docker picked for a service's container port */
const hostPort = (service: string, containerPort: number) => {
  // prints one line per address family, e.g. "0.0.0.0:49153"; the port is the same on each
  const output = execFileSync('docker', [...COMPOSE, 'port', service, String(containerPort)], {
    cwd: ROOT,
    encoding: 'utf-8',
  })
  return output.trim().split('\n')[0].split(':').at(-1)
}

/**
 * Builds the real images and starts the whole stack once per run. `--wait` returns when every
 * healthcheck passes. Set SYSTEM_KEEP_STACK=1 to leave it running for debugging.
 */
export default (project: TestProject) => {
  try {
    compose('up', '-d', '--build', '--wait')
  } catch (e) {
    compose('logs', '--tail', '50')
    compose('down', '-v')
    throw e
  }

  const stack = {
    apiUrl: `http://localhost:${hostPort('device-ingest', 3000)}`,
    brokerUrl: `mqtt://localhost:${hostPort('mosquitto', 1883)}`,
  }
  project.provide('systemStack', stack)

  return () => {
    if (process.env.SYSTEM_KEEP_STACK) {
      // the ports are random, so a kept stack is only reachable if they are printed
      logger.info(`Stack kept running: API ${stack.apiUrl}, broker ${stack.brokerUrl}`)
      return
    }
    compose('down', '-v')
  }
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation only works with interfaces
  export interface ProvidedContext {
    systemStack: { apiUrl: string; brokerUrl: string }
  }
}
