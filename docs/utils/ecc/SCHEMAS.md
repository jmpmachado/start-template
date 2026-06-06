# ECC — JSON Schemas Module

> Source: `utils/ECC/schemas/` · Count: 10 schemas · Validator: `ajv` (via npm)

ECC uses JSON Schema (Draft-07) to validate all configuration files, manifests, and state
artifacts. Schemas are enforced in CI by `scripts/ci/validate-*.js` and at runtime by
`scripts/lib/` utilities that call `ajv` before reading any structured config.

---

## Schema Catalog

| Schema File | Validates | Used By |
|---|---|---|
| `hooks.schema.json` | `hooks/hooks.json` — hook registry entries | CI, `plugin-hook-bootstrap.js` |
| `install-components.schema.json` | `manifests/install-components.json` | `install-plan.js` |
| `install-modules.schema.json` | `manifests/install-modules.json` | `install-plan.js` |
| `install-profiles.schema.json` | `manifests/install-profiles.json` | `install-plan.js` |
| `install-state.schema.json` | `.ecc/install-state.json` — idempotency record | `install-apply.js` |
| `ecc-install-config.schema.json` | User-provided install config (`ecc.config.json`) | `install-plan.js` |
| `package-manager.schema.json` | `.claude/package-manager.json` | `setup-package-manager.js` |
| `plugin.schema.json` | `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` | CI plugin validation |
| `provenance.schema.json` | SLSA provenance attestation files | Supply-chain CI |
| `state-store.schema.json` | `.ecc/state-store.json` — runtime state | `session-inspect.js` |

---

## Key Schemas

### `hooks.schema.json`

Validates each entry in `hooks/hooks.json`:

```jsonc
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "event", "command", "description"],
  "properties": {
    "id":          { "type": "string", "pattern": "^[a-z0-9:_-]+$" },
    "event":       { "type": "string", "enum": ["PreToolUse", "PostToolUse", "SessionStart", "PreCompact", "Stop", "SessionEnd"] },
    "matcher":     { "type": "object" },
    "command":     { "type": "string" },
    "description": { "type": "string", "maxLength": 200 },
    "async":       { "type": "boolean", "default": false },
    "timeout":     { "type": "integer", "minimum": 100, "maximum": 60000 }
  },
  "additionalProperties": false
}
```

### `install-profiles.schema.json`

Validates named installation profiles (`minimal`, `standard`, `full`, `enterprise`):

```jsonc
{
  "type": "object",
  "properties": {
    "profiles": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["name", "description", "components"],
        "properties": {
          "name":        { "type": "string" },
          "description": { "type": "string" },
          "components":  { "type": "array", "items": { "type": "string" } }
        }
      }
    }
  }
}
```

### `plugin.schema.json`

Validates Claude Code and Codex plugin manifests:

```jsonc
{
  "required": ["name", "version", "description", "entry"],
  "properties": {
    "name":        { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "version":     { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+(-[a-z0-9.]+)?$" },
    "description": { "type": "string", "maxLength": 500 },
    "entry":       { "type": "string" },
    "permissions": {
      "type": "array",
      "items": { "type": "string", "enum": ["read", "write", "bash", "mcp", "network"] }
    }
  }
}
```

### `state-store.schema.json`

Validates the runtime state store used by ECC hooks and the ECC 2.0 daemon:

```jsonc
{
  "required": ["version", "sessions", "updated_at"],
  "properties": {
    "version":    { "type": "string" },
    "sessions":   { "type": "array", "items": { "$ref": "#/definitions/Session" } },
    "updated_at": { "type": "string", "format": "date-time" }
  },
  "definitions": {
    "Session": {
      "required": ["id", "status", "created_at"],
      "properties": {
        "id":         { "type": "string", "format": "uuid" },
        "worktree":   { "type": ["string", "null"] },
        "status":     { "type": "string", "enum": ["created", "running", "paused", "stopped", "completed"] },
        "cost_usd":   { "type": "number", "minimum": 0 },
        "tokens":     { "type": "integer", "minimum": 0 },
        "created_at": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

---

## Validation in CI

All schemas are enforced in CI via:

```bash
# Validate hooks registry
node scripts/ci/validate-hooks.js

# Validate all installation manifests
node scripts/ci/validate-manifests.js

# Validate plugin manifests in all adapters
node scripts/ci/validate-plugins.js
```

These scripts fail with exit code 1 and a structured error report if validation fails.

---

## Runtime Validation

Scripts in `scripts/lib/` validate before reading:

```js
const { validate } = require('./validate.js');

const config = JSON.parse(fs.readFileSync('hooks.json', 'utf8'));
validate(config, require('../schemas/hooks.schema.json')); // throws on invalid
```

`validate.js` wraps `ajv` with `allErrors: true` and formatted error output.

---

## Adding a New Schema

1. Create `utils/ECC/schemas/<artifact>.schema.json`.
2. Use JSON Schema Draft-07 (`"$schema": "http://json-schema.org/draft-07/schema#"`).
3. Set `"additionalProperties": false` on all objects to prevent silent config drift.
4. Add a validation call in the consuming `scripts/lib/` module.
5. Add a CI validation script in `scripts/ci/validate-<artifact>.js`.
6. Add test fixtures in `tests/lib/schemas/`.
7. Register here and in [INDEX.md](INDEX.md).

---

## See Also

- [HOOKS.md](HOOKS.md) — hooks validated by `hooks.schema.json`
- [SCRIPTS.md](SCRIPTS.md) — CI validation scripts and `scripts/lib/validate.js`
- `utils/ECC/schemas/` — all schema source files
- `utils/ECC/manifests/` — manifests validated by install schemas
