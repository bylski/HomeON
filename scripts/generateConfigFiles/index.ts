import fs from 'node:fs'
import path from 'node:path'

import { CppHeaderBuilder, StructKey } from '../../helpers/cppHeaderBuilder'
import { EventSchema } from '../../helpers/jsonSchema'
import { buildCppHeaderFile, generateCppHeaderFile } from './cppHelpers'
import { buildTsFile, generateTsFile } from './tsHelpers'

const scriptDir = __dirname
const configsDir = path.resolve(scriptDir, '../../config')
const schemasDir = path.join(configsDir, '/schemas')

const cppOutputPath = path.resolve(
  __dirname,
  '../../firmware/lib/Mqtt/Events.h',
)
const tsOutputPath = path.resolve(__dirname, '../../generated/events.ts')

const extractSchemaMeta = (schemaPath: string) => {
  const schemaContent = JSON.parse(
    fs.readFileSync(schemaPath, { encoding: 'utf-8' }),
  ) as EventSchema
  const { 'x-topic-prefix': topic, title: eventName } = schemaContent

  return { topic, eventName }
}

/**
 * Takes JSON schemas and creates typescript and cpp files respectively.
 * This allows having one source of truth for both firmware and web services and keep
 * typescript and cpp header files in sync.
 */
const run = async () => {
  const schemaFiles = fs.readdirSync(schemasDir)
  const schemaFilePaths = schemaFiles.map((fName) => `${schemasDir}/${fName}`)

  let fullTs: string = ''
  const topicsWithType = new Map<string, string>()
  const cppHeaderBuilder = new CppHeaderBuilder()
  for (const filePath of schemaFilePaths) {
    // each pass builds part of cpp and typescript file
    const { topic, eventName } = extractSchemaMeta(filePath)

    fullTs = await buildTsFile(fullTs, filePath)
    buildCppHeaderFile(cppHeaderBuilder, filePath)

    if (!!topic && !!eventName) {
      topicsWithType.set(topic, eventName)
    }
  }

  await generateTsFile(fullTs, topicsWithType, tsOutputPath)
  await generateCppHeaderFile(cppHeaderBuilder, topicsWithType, cppOutputPath)
}

run()
