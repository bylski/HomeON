import { execFileSync } from 'node:child_process'

/**
 * Checks (or with `--fix` applies) clang-format on every firmware C++ file. Optional file paths
 * limit the run to those files (used by lint-staged).
 */
const run = () => {
  const args = process.argv.slice(2)
  const fix = args.includes('--fix')
  const passedFiles = args.filter((arg) => arg !== '--fix')

  const files = passedFiles.length
    ? passedFiles
    : execFileSync(
        'git',
        [
          'ls-files',
          '--cached',
          '--others',
          '--exclude-standard',
          'firmware/*.cpp',
          'firmware/*.h',
        ],
        { encoding: 'utf-8' },
      )
        .split('\n')
        .filter(Boolean)

  if (!files.length) {
    return
  }

  const clangArgs = fix ? ['-i', ...files] : ['--dry-run', '--Werror', ...files]

  try {
    execFileSync('clang-format', clangArgs, { stdio: 'inherit' })
  } catch {
    console.error('\nC++ formatting issues found. Run `pnpm format` to fix them.')
    process.exit(1)
  }
}

run()
