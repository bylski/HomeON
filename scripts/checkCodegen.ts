import { execFileSync, execSync } from 'node:child_process'

const GENERATED_FILES = ['generated/events.ts', 'firmware/lib/Events/Events.h']

/**
 * Regenerates the event types and fails if the result differs from the working tree, which means
 * a schema changed without regenerating, or a generated file was edited by hand.
 */
const run = () => {
  execSync('pnpm generate-configs', { stdio: 'inherit' })

  try {
    execFileSync('git', ['diff', '--exit-code', '--', ...GENERATED_FILES], { stdio: 'inherit' })
  } catch {
    console.error(
      '\nGenerated files were out of date and have now been regenerated. ' +
        'Review and stage them (never edit them by hand, change config/schemas instead).',
    )
    process.exit(1)
  }
}

run()
