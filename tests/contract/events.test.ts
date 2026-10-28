import fs from 'node:fs'
import path from 'node:path'
import { Ajv } from 'ajv'
import { describe, expect, it } from 'vitest'
import {
  commandEventSchema,
  discoveryEventSchema,
  telemetryEventSchema,
} from '../../services/device-ingest/src/schemas/events.js'

// the JSON schemas are the source of truth (docs/conventions/contracts.md): every payload must get
// the same verdict from them and from the backend's Zod schemas, and firmware output must pass both

const ROOT = path.resolve(import.meta.dirname, '../..')
const SCHEMAS_DIR = path.join(ROOT, 'config/schemas')

/** only the part of a Zod schema the test uses, so it does not depend on a zod copy of its own */
type ZodLike = { safeParse: (payload: unknown) => { success: boolean } }

const EVENTS = {
  discovery: { schemaFile: 'discovery-event.json', zodSchema: discoveryEventSchema },
  telemetry: { schemaFile: 'telemetry-event.json', zodSchema: telemetryEventSchema },
  command: { schemaFile: 'command-event.json', zodSchema: commandEventSchema },
} as const satisfies Record<string, { schemaFile: string; zodSchema: ZodLike }>

const ajv = new Ajv({ allErrors: true })
ajv.addKeyword('x-topic-prefix')

/** reads every `*.json` in a folder as [file name, parsed payload]; a missing folder is empty */
const readJsonFiles = (dir: string): [string, unknown][] =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => [file, JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))])
    : []

it('covers every schema in config/schemas', () => {
  const covered = Object.values(EVENTS).map(({ schemaFile }) => schemaFile)
  expect(covered.sort()).toEqual(fs.readdirSync(SCHEMAS_DIR).sort())
})

for (const [event, { schemaFile, zodSchema }] of Object.entries(EVENTS)) {
  describe(`${event} event`, () => {
    const jsonSchema = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, schemaFile), 'utf-8'))
    const validateJson = ajv.compile(jsonSchema)

    const verdicts = (payload: unknown) => ({
      jsonSchema: validateJson(payload) ? 'accepted' : 'rejected',
      zod: zodSchema.safeParse(payload).success ? 'accepted' : 'rejected',
    })

    const fixturesDir = path.join(import.meta.dirname, 'fixtures', event)
    const goldenDir = path.join(import.meta.dirname, 'golden', event)

    it.each(readJsonFiles(path.join(fixturesDir, 'valid')))('accepts %s', (_file, payload) => {
      expect(verdicts(payload)).toEqual({ jsonSchema: 'accepted', zod: 'accepted' })
    })

    it.each(readJsonFiles(path.join(fixturesDir, 'invalid')))('rejects %s', (_file, payload) => {
      expect(verdicts(payload)).toEqual({ jsonSchema: 'rejected', zod: 'rejected' })
    })

    // written by the firmware native tests (firmware/test), see docs/conventions/testing.md
    it.each(readJsonFiles(goldenDir))('accepts firmware output %s', (_file, payload) => {
      expect(verdicts(payload)).toEqual({ jsonSchema: 'accepted', zod: 'accepted' })
    })
  })
}
