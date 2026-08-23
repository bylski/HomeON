import fs from 'node:fs'
import path from 'node:path'
import * as schema2Ts from 'json-schema-to-typescript'
import prettier from 'prettier'
import { CppHeaderBuilder } from '../helpers/cppHeaderBuilder'
import {
  isArraySchemaProperty,
  isPrimitiveSchemaProperty,
  isRefSchemaProperty,
  SchemaProperties,
  SchemaProperty,
  SchemaRefString,
} from '../helpers/jsonSchema'

const scriptDir = import.meta.dirname
const configsDir = path.resolve(scriptDir, '../config')
const schemasDir = path.join(configsDir, '/schemas')

const tsOutputPath = path.resolve(import.meta.dirname, '../generated/topics.ts')

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

const extractRefSchemaName = (ref: SchemaRefString) => ref.split('/').at(-1)!

const buildCppFromSchemaProperties = (
  schemaObject: any,
  builder: CppHeaderBuilder,
) => {
  if (!schemaObject.properties) {
    return
  }

  const properties = schemaObject.properties as SchemaProperty[]
  const propertiesList = Object.entries(properties) as SchemaProperties

  builder.startStruct(schemaObject.title)
  for (const [key, property] of propertiesList) {
    if (isPrimitiveSchemaProperty(property)) {
      builder.addStructKey({ key, varType: property.type })
    }

    if (isArraySchemaProperty(property)) {
    }

    if (isRefSchemaProperty(property)) {
    }
  }
  builder.endStruct()
}

const buildCppHeaderFile = async (
  builder: CppHeaderBuilder,
  schemaPath: string,
) => {
  const schemaObject = JSON.parse(
    fs.readFileSync(schemaPath, { encoding: 'utf-8' }),
  )
  buildCppFromSchemaProperties(schemaObject, builder)

  // const mappedProperties = Object.entries(schemaObject.properties).map(
  //   ([key, meta]) => ({ key, varType: (meta as any).type ?? 'unknown' }),
  // )
  // builder.buildStruct(schemaObject.title, mappedProperties)
}

const run = async () => {
  const schemaFiles = fs.readdirSync(schemasDir)
  const schemaFilePaths = schemaFiles.map((fName) => `${schemasDir}/${fName}`)

  let fullTs: string = ''
  const cppHeaderBuilder = new CppHeaderBuilder()
  for (const filePath of schemaFilePaths) {
    // build typescript file
    fullTs = await buildTsFile(fullTs, filePath)

    // build cpp header file
    buildCppHeaderFile(cppHeaderBuilder, filePath)
  }
  console.log(cppHeaderBuilder.resolve())

  await generateTsFile(fullTs)
}

run()
