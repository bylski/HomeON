export const SCHEMA_PRIMITVE_TYPES = [
  'integer',
  'number',
  'string',
  'boolean',
] as const

export type SchemaPrimitiveType = (typeof SCHEMA_PRIMITVE_TYPES)[number]

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

export type SchemaProperty = BaseSchemaProperty &
  (PrimitiveSchemaProperty | ArraySchemaProperty | RefSchemaProperty)

export type SchemaProperties<Key extends string = string> = Array<
  [Key, SchemaProperty]
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
