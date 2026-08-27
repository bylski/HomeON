import fs from 'node:fs'
import path from 'node:path'
import * as schema2Ts from 'json-schema-to-typescript'
import prettier from 'prettier'
import { CppHeaderBuilder, StructKey } from '../helpers/cppHeaderBuilder'
import {
  extractRefSchemaName,
  getRefSchema,
  isArraySchemaProperty,
  isFallbackSchemaProperty,
  isPrimitiveSchemaProperty,
  isRefSchemaProperty,
  SchemaProperties,
  SchemaProperty,
} from '../helpers/jsonSchema'
import { execSync } from 'node:child_process'

const scriptDir = __dirname
const configsDir = path.resolve(scriptDir, '../config')
const schemasDir = path.join(configsDir, '/schemas')

const cppOutputPath = path.resolve(
  __dirname,
  '../firmware/libs/MqttEvents/Events.h',
)
const tsOutputPath = path.resolve(__dirname, '../generated/events.ts')

const generateTsFile = async (fullTs: string) => {
  const configFile = await prettier.resolveConfigFile(tsOutputPath)
  const prettierConfig = configFile
    ? await prettier.resolveConfig(configFile)
    : undefined

  const formatted = await prettier.format(fullTs, {
    ...prettierConfig,
    filepath: tsOutputPath,
  })

  fs.writeFileSync(tsOutputPath, formatted)
}

const buildTsFile = async (currentTsCode: string, schemaPath: string) => {
  const rawTs = await schema2Ts.compileFromFile(schemaPath, {
    bannerComment: '',
    format: false,
  })
  return currentTsCode + rawTs + '\n'
}

/**
 * Iterates over schema properties and uses cpp builder class to create structs out of them.
 * Handles property schema references ($ref) by recursively traversing each node and
 * appending referenced dependency structs above their consumers.
 * @param rootSchema
 * @param nodeSchema
 * @param builder
 * @returns
 */
const buildCppFromSchemaProperties = (
  rootSchema: any,
  nodeSchema: any,
  builder: CppHeaderBuilder,
) => {
  if (!rootSchema.properties) {
    return
  }

  const properties = nodeSchema.properties as SchemaProperty[]
  const propertiesList = Object.entries(properties) as SchemaProperties

  const structKeys: StructKey[] = []

  for (const [key, property] of propertiesList) {
    if (isPrimitiveSchemaProperty(property)) {
      structKeys.push({ key, type: property.type })
      continue
    }

    if (isArraySchemaProperty(property)) {
      const itemsProperty = property.items

      if (isPrimitiveSchemaProperty(itemsProperty)) {
        structKeys.push({ key, type: 'array', itemType: itemsProperty.type })
      }

      if (isRefSchemaProperty(itemsProperty)) {
        const refType = extractRefSchemaName(itemsProperty.$ref)

        buildCppFromSchemaProperties(
          rootSchema,
          getRefSchema(rootSchema, refType),
          builder,
        )
        structKeys.push({ key, type: 'array', itemType: refType })
      }
      continue
    }

    if (isRefSchemaProperty(property)) {
      const refType = extractRefSchemaName(property.$ref)

      buildCppFromSchemaProperties(
        rootSchema,
        getRefSchema(rootSchema, refType),
        builder,
      )
      structKeys.push({ key, type: refType })
      continue
    }

    if (isFallbackSchemaProperty(property)) {
      structKeys.push({ key, type: 'jsonVariant' })
      continue
    }

    throw new Error(`Property not supported: ${JSON.stringify(property)}`)
  }

  builder.addStruct(nodeSchema.title, structKeys)
}

const buildCppHeaderFile = async (
  builder: CppHeaderBuilder,
  schemaPath: string,
) => {
  const schemaObject = JSON.parse(
    fs.readFileSync(schemaPath, { encoding: 'utf-8' }),
  )
  buildCppFromSchemaProperties(schemaObject, schemaObject, builder)
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
  const cppHeaderBuilder = new CppHeaderBuilder()
  for (const filePath of schemaFilePaths) {
    // each pass builds part of cpp and typescript file
    fullTs = await buildTsFile(fullTs, filePath)
    buildCppHeaderFile(cppHeaderBuilder, filePath)
  }

  await generateTsFile(fullTs)

  fs.writeFileSync(cppOutputPath, cppHeaderBuilder.resolve())
  execSync(`clang-format -i ${cppOutputPath}`, { stdio: 'inherit' })
}

run()
