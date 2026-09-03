export type EventSchema = {
  title: string
  description?: string
  type: SchemaPrimitiveType | 'object'
  required: string[]
  additionalProperties: boolean
  properties: SchemaProperties
  ['x-topic-prefix']?: string
}

export const SCHEMA_PRIMITVE_TYPES = [
  'integer',
  'number',
  'string',
  'boolean',
] as const

export type SchemaPrimitiveType = (typeof SCHEMA_PRIMITVE_TYPES)[number]

export const SCHEMA_PROPERTIES_WITH_FALLBACK = ['oneOf'] as const

export type SchemaPropertyWithFallback =
  (typeof SCHEMA_PROPERTIES_WITH_FALLBACK)[number]

type BaseSchemaProperty = { description?: string }
type PrimitiveSchemaProperty = { type: SchemaPrimitiveType }

export type SchemaRefString = `#/definitions/${string}`
type RefSchemaProperty = {
  $ref: SchemaRefString
}

type ArraySchemaProperty = {
  type: 'array'
  items: SchemaProperty
}

type FallbackSchemaProperty = { [K in SchemaPropertyWithFallback]: any }

export type SchemaProperty = BaseSchemaProperty &
  (
    | PrimitiveSchemaProperty
    | ArraySchemaProperty
    | RefSchemaProperty
    | FallbackSchemaProperty
  )

export type SchemaProperties<Key extends string = string> = Record<
  Key,
  SchemaProperty
>

export const isPrimitiveSchemaProperty = (
  property: SchemaProperty,
): property is PrimitiveSchemaProperty =>
  'type' in property &&
  SCHEMA_PRIMITVE_TYPES.includes(property.type as SchemaPrimitiveType)

export const isRefSchemaProperty = (
  property: SchemaProperty,
): property is RefSchemaProperty => '$ref' in property

export const isArraySchemaProperty = (
  property: SchemaProperty,
): property is ArraySchemaProperty =>
  'type' in property && 'items' in property && property.type === 'array'

export const isFallbackSchemaProperty = (
  property: SchemaProperty,
): property is FallbackSchemaProperty =>
  SCHEMA_PROPERTIES_WITH_FALLBACK.some((p) => Object.hasOwn(property, p))

export const extractRefSchemaName = (ref: SchemaRefString): string =>
  ref.split('/').at(-1)!

export const getRefSchema = (rootSchema: any, ref: string) =>
  rootSchema.definitions[ref]
