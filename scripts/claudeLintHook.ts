import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Claude Code PostToolUse hook (.claude/settings.json): formats the file Claude just edited and
 * reports lint errors that can't be auto-fixed. Exit code 2 feeds stderr back to Claude.
 */

type HookInput = { tool_input?: { file_path?: string } }

const JS_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs']
const PRETTIER_EXTENSIONS = [...JS_EXTENSIONS, '.json', '.md', '.yml', '.yaml']
const CPP_EXTENSIONS = ['.cpp', '.h']

/** runs a project tool, returning its combined output on failure instead of throwing */
const runTool = (command: string, args: string[]): string | undefined => {
  try {
    execFileSync(command, args, { encoding: 'utf-8', stdio: 'pipe', shell: true })
    return undefined
  } catch (e) {
    const { stdout = '', stderr = '' } = e as { stdout?: string; stderr?: string }
    return `${stdout}${stderr}`.trim()
  }
}

const run = () => {
  const input = JSON.parse(fs.readFileSync(0, 'utf-8')) as HookInput
  const filePath = input.tool_input?.file_path
  if (!filePath || !fs.existsSync(filePath)) {
    return
  }

  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
  const relativePath = path.relative(projectDir, filePath)
  // files outside the repo (e.g. memory, scratchpad) follow no project conventions
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return
  }

  const extension = path.extname(filePath)
  const quotedPath = `"${filePath}"`
  const problems: string[] = []

  if (CPP_EXTENSIONS.includes(extension) && relativePath.startsWith('firmware')) {
    const output = runTool('clang-format', ['-i', quotedPath])
    if (output) problems.push(`clang-format failed:\n${output}`)
  }

  if (JS_EXTENSIONS.includes(extension)) {
    const output = runTool('npx', ['eslint', '--fix', '--no-warn-ignored', quotedPath])
    if (output) problems.push(`ESLint errors (see docs/conventions):\n${output}`)
  }

  if (PRETTIER_EXTENSIONS.includes(extension)) {
    const output = runTool('npx', ['prettier', '--write', '--ignore-unknown', quotedPath])
    if (output) problems.push(`Prettier failed:\n${output}`)
  }

  if (problems.length) {
    process.stderr.write(`${relativePath} breaks project conventions:\n\n${problems.join('\n\n')}`)
    process.exit(2)
  }
}

run()
