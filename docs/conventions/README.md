# Code conventions

Rules for all code in the HomeOn monorepo. When existing code disagrees with these documents, the
documents win and the code should be fixed.

| File                                               | Covers                                                       |
| -------------------------------------------------- | ------------------------------------------------------------ |
| [repository.md](repository.md)                     | monorepo layout, workspaces, where shared code goes          |
| [contracts.md](contracts.md)                       | JSON schemas as single source of truth, codegen, zod, DTOs   |
| [mqtt.md](mqtt.md)                                 | topic structure, versioning, QoS and retain rules            |
| [typescript.md](typescript.md)                     | TS style rules, naming, environment variables                |
| [backend.md](backend.md)                           | service module layers, Drizzle and database rules            |
| [comments-and-logging.md](comments-and-logging.md) | comment style, `fixme` markers, logger usage                 |
| [firmware.md](firmware.md)                         | C++ formatting, Google naming (`k`, `_`), firmware structure |
| [frontend.md](frontend.md)                         | TBD                                                          |
| [testing.md](testing.md)                           | test layers, tools, where test files go, how to write them   |
| [tooling.md](tooling.md)                           | linters, formatters, hooks: which tool enforces which rule   |

Keep each file focused on one topic. Add a new file (and a row here) when a topic grows beyond a
section of an existing one.
