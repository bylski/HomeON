import { SchemaPrimitiveType } from './jsonSchema'

type StructKeyType = SchemaPrimitiveType | (string & {})

export type StructKey = {
  key: string
} & (
  | {
      type: StructKeyType
    }
  | { type: 'array'; itemType: StructKeyType }
)

export class CppHeaderBuilder {
  private includes = new Set<string>(['Arduino.h', 'ArduinoJson.h', 'vector'])

  private headerBlocks: string[] = []
  private structBlocks: string[] = []

  constructor() {
    this.write.header('#pragma once;\n')
    this.includes.forEach((lib) => this.writeInclude(lib))
    this.write.header('\n')
  }

  private write = {
    header: (str: string) => this.headerBlocks.push(str),
    struct: (str: string) => this.structBlocks.push(str),
  }

  private writeInclude(packageName: string) {
    this.write.header(`#include <${packageName}>`)
  }

  private inputTypeToCppType(type: string) {
    if (type === 'integer') return 'int64_t'
    if (type === 'number') return 'double'
    if (type === 'boolean') return 'bool'
    if (type === 'string') return 'String'
    return type
  }

  private addStructKey({ key, type }: StructKey) {
    this.write.struct(`${this.inputTypeToCppType(type)} ${key};`)
    return this
  }

  private addStructArrayKey({
    key,
    itemType,
  }: Extract<StructKey, { type: 'array' }>) {
    this.write.struct(
      `std::vector<${this.inputTypeToCppType(itemType)}> ${key};`,
    )
  }

  addStruct(name: string, fields: StructKey[]) {
    this.write.struct(`struct ${name} {`)
    for (const field of fields) {
      'itemType' in field
        ? this.addStructArrayKey(field)
        : this.addStructKey(field)
    }
    this.write.struct('};\n')
  }

  resolve() {
    return `${this.headerBlocks.join('\n')}` + `${this.structBlocks.join('\n')}`
  }
}
