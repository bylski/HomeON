import { type SchemaPrimitiveType } from './jsonSchema'

type StructKeyType = SchemaPrimitiveType | 'variant' | (string & {})

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
  // plain C++ only
  private includes = new Set<string>(['cstdint', 'string', 'string_view', 'variant', 'vector'])

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
    if (type === 'string') return 'std::string'
    if (type === 'variant') return 'std::variant<int, double, bool, std::string>'
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

  // fixme: optional schema fields become plain members, so firmware always sends them with a
  // default value (`max_value: 0`, `ip_address: ""`, `timestamp: 0`) instead of leaving them out,
  // visible in the firmware snapshots. Generating std::optional (and skipping it in the
  // converters) would fix it.
  addStruct(name: string, fields: StructKey[]) {
    this.write.struct(`struct ${name} {`)
    for (const field of fields) {
      if ('itemType' in field) {
        this.addStructArrayKey(field)
      } else {
        this.addStructKey(field)
      }
    }
    this.write.struct('};\n')
  }

  addBaseTemplateStruct(structName: string) {
    this.write.template('template<typename T>')
    this.write.template(`struct ${structName};`)
  }

  addTemplateStruct(structName: string, templateType: string, fields: StructKey[]) {
    this.write.template('template<>')
    this.write.template(`struct ${structName}<${templateType}> {`)
    for (const field of fields) {
      if ('itemType' in field) {
        this.addStructArrayKey(field, 'template')
      } else {
        this.addStructKey(field, 'template')
      }
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
