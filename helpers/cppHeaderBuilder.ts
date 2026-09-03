import { SchemaPrimitiveType } from './jsonSchema'

type StructKeyType = SchemaPrimitiveType | 'jsonVariant' | (string & {})

export type StructKey = {
  key: string
  value?: string
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
  private templateBlocks: string[] = []

  constructor() {
    this.write.header('#pragma once\n')
    this.includes.forEach((lib) => this.writeInclude(lib))
    this.write.header('\n')
  }

  private write = {
    header: (str: string) => this.headerBlocks.push(str),
    struct: (str: string) => this.structBlocks.push(str),
    template: (str: string) => this.templateBlocks.push(str),
  }

  private writeInclude(packageName: string) {
    this.write.header(`#include <${packageName}>`)
  }

  private inputTypeToCppType(type: StructKeyType) {
    if (type === 'integer') return 'int64_t'
    if (type === 'number') return 'double'
    if (type === 'boolean') return 'bool'
    if (type === 'string') return 'String'
    if (type === 'jsonVariant') return 'JsonVariant'
    return type
  }

  private prepareStructKeyValue(value: StructKey['value']): string {
    if (!value) {
      return ''
    }
    let preparedValue = ''

    if (typeof value === 'string') {
      preparedValue = `"${value}"` // if value is a string we want to generate inside of ""
    }

    return `= ${preparedValue}`
  }

  private addStructKey(
    { key, type, value }: StructKey,
    writer: keyof typeof this.write = 'struct',
  ) {
    this.write[writer](
      `${this.inputTypeToCppType(type)} ${key} ${this.prepareStructKeyValue(value)};`,
    )
    return this
  }

  private addStructArrayKey(
    { key, itemType, value }: Extract<StructKey, { type: 'array' }>,
    writer: keyof typeof this.write = 'struct',
  ) {
    this.write[writer](
      `std::vector<${this.inputTypeToCppType(itemType)}> ${key} ${this.prepareStructKeyValue(value)};`,
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

  addBaseTemplateStruct(structName: string) {
    this.write.template('template<typename T>')
    this.write.template(`struct ${structName};`)
  }

  addTemplateStruct(
    structName: string,
    templateType: string,
    fields: StructKey[],
  ) {
    this.write.template('template<>')
    this.write.template(`struct ${structName}<${templateType}> {`)
    for (const field of fields) {
      'itemType' in field
        ? this.addStructArrayKey(field, 'template')
        : this.addStructKey(field, 'template')
    }
    this.write.template('};\n')
  }

  resolve() {
    return (
      `${this.headerBlocks.join('\n')}` +
      `${this.structBlocks.join('\n')}` +
      '\n' +
      `${this.templateBlocks.join('\n')}`
    )
  }
}
