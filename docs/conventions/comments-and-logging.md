# Comments and logging

- Exported functions, types and non-obvious schema columns get a short `/** ... */` comment.
- Inline comments explain **why**, not what:
  ```ts
  // drizzle rejects an insert with no values, and a device may report no components at all
  if (toSave.components.length) { ... }
  ```
- Mark known problems with `// fixme: <what and why>` so they can be found with grep.
- Never call `console.*` directly. Create a logger per module and give it a context tag:
  ```ts
  const logger = buildLogger('[MQTT]')
  logger.info(`Connected to ${host}`)
  ```
