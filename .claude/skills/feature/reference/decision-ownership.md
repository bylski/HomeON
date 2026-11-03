# Who owns a decision

The user owns the decisions that shape the system and are expensive to undo. The agent owns
implementation details and records them as defaults, so the user can still see and overrule
them.

## The user decides

| Area                   | Examples                                                                       |
| ---------------------- | ------------------------------------------------------------------------------ |
| architecture           | which service owns the logic, a new data flow, sync vs. async processing       |
| contracts and schemas  | MQTT payloads, topics, QoS and retain flags, REST endpoints and their DTOs     |
| data model             | new tables or columns, retention and deletion of data, migrations that lose it |
| services, dependencies | a new container, service, library or external tool                             |
| security               | authentication, encryption, secrets, exposed ports, input trust boundaries     |
| user-visible behaviour | what the user sees or has to do, defaults they will notice, error handling     |

Each one goes in **Decisions** with real options, trade-offs, evidence and a recommendation.

## The agent decides

Everything inside those decisions: file, function and variable names, internal structure, which
existing helpers to use, test helpers and fixtures, log messages, and constants tuned against a
requirement that is already decided. Each non-obvious choice goes in **Defaults chosen by the
agent** with a one-line reason.

## When it is unclear

A choice belongs to the user when any of these is true:

- changing it later needs a migration, a firmware reflash or a new contract version
- it affects another service, the firmware or the frontend
- it trades one goal in `docs/goals.md` against another, such as latency against Pi memory
- reasonable people would choose differently and the evidence does not settle it

When still unsure, make it a decision. A decision the user did not need costs them one question;
a default that should have been a decision costs a rewrite.

The user can turn any default into a decision while answering questions, and can hand a decision
back to the agent ("your call"). The spec then records the choice as a default, saying who passed
it on.
