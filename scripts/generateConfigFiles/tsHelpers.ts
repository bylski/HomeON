import fs from 'node:fs'
import * as schema2Ts from 'json-schema-to-typescript'
import prettier from 'prettier'

export const generateTsFile = async (
  fullTs: string,
  topicsWithType: Map<string, string>,
  outPath: string,
) => {
  fullTs += `export type TopicPrefixesWithTypes = {
    ${Array.from(topicsWithType).map(([key, val]) => `'${key}': ${val}`)}
  }`

  const configFile = await prettier.resolveConfigFile(outPath)
  const prettierConfig = configFile
    ? await prettier.resolveConfig(configFile)
    : undefined

  const formatted = await prettier.format(fullTs, {
    ...prettierConfig,
    filepath: outPath,
  })

  fs.writeFileSync(outPath, formatted)
}

export const buildTsFile = async (
  currentTsCode: string,
  schemaPath: string,
) => {
  const rawTs = await schema2Ts.compileFromFile(schemaPath, {
    bannerComment: '',
    format: false,
  })
  return currentTsCode + rawTs + '\n'
}
