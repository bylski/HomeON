import { CppHeaderBuilder, StructKey } from '../../helpers/cppHeaderBuilder'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import {
  EventSchema,
  extractRefSchemaName,
  getRefSchema,
  isArraySchemaProperty,
  isFallbackSchemaProperty,
  isPrimitiveSchemaProperty,
  isRefSchemaProperty,
} from '../../helpers/jsonSchema'

export const generateCppHeaderFile = async (
  builder: CppHeaderBuilder,
  topicsWithType: Map<string, string>,
  outPath: string,
) => {
  const templateStructName = 'TopicTraits'
  builder.addBaseTemplateStruct(templateStructName)
  for (const [topic, type] of topicsWithType.entries()) {
    builder.addTemplateStruct(templateStructName, type, [
      {
        key: 'prefix',
        type: 'static constexpr const std::string_view',
        value: topic,
      },
    ])
  }

  fs.writeFileSync(outPath, builder.resolve())
  execSync(`clang-format -i ${outPath}`, { stdio: 'inherit' })
}

export const buildCppHeaderFile = async (
  builder: CppHeaderBuilder,
  schemaPath: string,
) => {
  const schemaObject = JSON.parse(
    fs.readFileSync(schemaPath, { encoding: 'utf-8' }),
  )
  buildCppFromSchemaProperties(schemaObject, schemaObject, builder)
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
  rootSchema: EventSchema,
  nodeSchema: EventSchema,
  builder: CppHeaderBuilder,
) => {
  if (!rootSchema.properties) {
    return
  }

  const properties = nodeSchema.properties
  const propertiesList = Object.entries(properties)

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
