import { SchemaPrimitiveType } from './jsonSchema'

type InputType = SchemaPrimitiveType | 'unknown' | 'ref'

type InputKeyWithType = {
  key: string
  varType: InputType
}

export class CppHeaderBuilder {
  private includes = new Set<string>(['Arduino.h', 'ArduinoJson.h', 'vector'])

  //fixme
  // think about how to resolve nested schemas (refs)
  private headerBlocks: string[] = []
  private structBlocks: string[] = []

  constructor() {
    this.write.header('#pragma once\n')
    this.includes.forEach((lib) => this.writeInclude(lib))
    this.write.header('\n')
  }

  private write = {
    header: (str: string) => this.headerBlocks.push(str),
    struct: (str: string) => this.structBlocks.push(str),
  }
  // private write(string: string) {
  //   this.rawHeaderFile =
  //     this.rawHeaderFile.substring(0, this.currentIndex) +
  //     string +
  //     this.rawHeaderFile.substring(this.currentIndex, this.rawHeaderFile.length)
  //   this.currentIndex = this.rawHeaderFile.length
  // }

  private writeInclude(packageName: string) {
    this.write.header(`#include <${packageName}>`)
  }

  private inputTypeToCppType(type: InputType) {
    if (type === 'integer') return 'int64_t'
    if (type === 'number') return 'double'
    if (type === 'boolean') return 'bool'
    if (type === 'string') return 'String'
    if (type === 'unknown') return 'JsonVariant'
  }

  startStruct(name: string) {
    this.write.struct(`struct ${name} {`)
  }

  addStructKey({ key, varType }: InputKeyWithType) {
    this.write.struct(`${this.inputTypeToCppType(varType)} ${key}`)
    return this
  }

  addStructArrayKey({ key, varType }: InputKeyWithType) {
    let cppType: ReturnType<typeof this.inputTypeToCppType>
    if (varType === 'ref') {
      cppType = 'JsonVariant' //fixme
    } else {
      cppType = this.inputTypeToCppType(varType)
    }

    this.write.struct(`std::vector<${this.inputTypeToCppType(varType)}> ${key}`)
    return this
  }

  endStruct() {
    this.write.struct('};\n')
  }

  resolve() {
    return `${this.headerBlocks.join('\n')}` + `${this.structBlocks.join('\n')}`
  }
}
