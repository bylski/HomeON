// staged-file checks run by the husky pre-commit hook (.husky/pre-commit)
export default {
  '*.{ts,tsx,js,mjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': 'prettier --write',
  'firmware/**/*.{cpp,h}': 'tsx scripts/lintCpp.ts --fix',
  // a function so lint-staged doesn't append file names: the check always covers all schemas
  '{config/schemas/*.json,generated/events.ts,firmware/lib/Mqtt/Events.h}': () =>
    'tsx scripts/checkCodegen.ts',
}
