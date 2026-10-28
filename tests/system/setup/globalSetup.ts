import { execFileSync } from 'node:child_process'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../../..')
const COMPOSE = ['compose', '-p', 'homeon-system', '-f', 'compose.yml', '-f', 'compose.system.yml']

const compose = (...args: string[]) =>
  execFileSync('docker', [...COMPOSE, ...args], { cwd: ROOT, stdio: 'inherit' })

/**
 * Builds the real images and starts the whole stack once per run. `--wait` returns when every
 * healthcheck passes. Set SYSTEM_KEEP_STACK=1 to leave it running for debugging.
 */
export default () => {
  try {
    compose('up', '-d', '--build', '--wait')
  } catch (e) {
    compose('logs', '--tail', '50')
    compose('down', '-v')
    throw e
  }

  return () => {
    if (!process.env.SYSTEM_KEEP_STACK) {
      compose('down', '-v')
    }
  }
}
