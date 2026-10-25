# Firmware (C++ / PlatformIO)

## Formatting

Formatting comes from `.clang-format` (Google style, 4-space indent). Run clang-format; don't
format by hand.

## Naming

Naming follows the [Google C++ style guide](https://google.github.io/styleguide/cppguide.html#Naming):

| Kind                          | Style              | Example                        |
| ----------------------------- | ------------------ | ------------------------------ |
| types (class/struct/enum)     | PascalCase         | `MqttService`, `MqttConfig`    |
| functions and methods         | PascalCase         | `Connect()`, `Publish()`       |
| simple accessors (optional)   | like the member    | `client()` for `client_`       |
| variables, parameters         | snake_case         | `board_id`, `distance`         |
| struct fields                 | snake_case         | `connect_retry_time_ms`        |
| class data members            | snake_case + `_`   | `client_`, `config_`           |
| constants                     | `k` + PascalCase   | `kTrigPin`, `kMqttHost`        |
| macros (`#define`)            | UPPER_CASE         | `ENV_WIFI_SSID`                |
| namespaces                    | PascalCase         | `HomeOn`                       |

### When to use the `k` prefix

`k` marks a value that is fixed at compile time and never changes while the program runs:

- `const` / `constexpr` variables at file or namespace level: `const uint8_t kTrigPin = D1;`
- `static constexpr` class/struct members: `static constexpr std::string_view kPrefix = ...;`

It is **not** used for variables that change (`wifi_service`, `distance`), or for `const` locals
and parameters (`const char* board_id`), where `const` only means "this function won't modify
it".

**Why not UPPER_CASE?** UPPER_CASE is reserved for macros. A macro is a blind text replacement
that ignores namespaces and scopes, and Arduino defines many of them (`HIGH`, `LED_BUILTIN`,
`D1`, ...). A constant named like a macro gets silently replaced by it. With `kName`, a real
constant can never collide with a macro, and the name tells you which of the two you're
looking at.

### When to use the `_` suffix

`_` marks a **data member of a class**: state that lives in the object (`client_`, `config_`).
Inside methods it shows at a glance what belongs to the object and what is a local or a parameter,
and it avoids clashes like the constructor parameter `client` vs the member `client_`.

It is **not** used for struct fields (`MqttConfig::port`, generated event fields), since structs
are passive data read from outside, and not for class constants, which use `k` instead.

Rule of thumb: a `class` with private state uses `name_`; a `struct` with public fields uses `name`.

### Exceptions

- Struct fields that mirror JSON schema keys are snake_case anyway, which keeps the generated
  `Events.h` consistent with hand-written code.
- Names required by an external API keep that API's spelling (`setup()` / `loop()` for Arduino,
  `Converter<T>::toJson` for ArduinoJson).
- An accessor may be named like its member when the PascalCase name clashes with an existing type
  (`client()`, because Arduino already has `class Client`).

## Structure

- All library code goes in `namespace HomeOn`.
- Libraries (`firmware/lib/`) never depend on a specific device. Each device's specifics (pins,
  IDs, discovery payload) stay in `firmware/devices/<device_id>/`.
- Secrets and environment values come from `firmware/.env` (via `scripts/get_env.py`) and are
  never hard-coded in `config.h`.
