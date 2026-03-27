# Agent Exoskeleton Specification v0.1.0

A lightweight, git-native standard for defining AI agents. Runtime-agnostic. Your repo is your agent.

---

## Design Principles

1. **Minimal by default** — two files to define an agent (`agent.yaml` + `IDENTITY.md`). Everything else is optional.
2. **Runtime-agnostic** — definitions describe *what* the agent is, not *how* it runs. Adapters handle the translation.
3. **Git-native** — agents are repos. Fork to create variants. Branch to experiment. Diff to compare. PR to evolve.
4. **Built for adaptability** — the spec grows through optional directories, not required fields. New capabilities are additive.
5. **Agent-readable** — all documentation assumes AI agents are the primary consumers. Be precise, structured, and unambiguous.

---

## Directory Structure

```
agent.yaml              # REQUIRED — Agent manifest
IDENTITY.md             # REQUIRED — Who the agent is

rules/                  # Optional — Behavioral constraints
  RULES.md              # General rules
  {context}.md          # Context-specific rules (e.g., safety.md, compliance.md)

skills/                 # Optional — Capabilities
  {name}/
    SKILL.md            # Skill definition (YAML frontmatter + instructions)

tools/                  # Optional — Tool definitions
  {name}.yaml           # Tool schema (name, description, input_schema)

knowledge/              # Optional — Reference documents
  index.yaml            # Document manifest (always_load flag)
  {name}.md             # Reference documents

memory/                 # Optional — Persistent state
  MEMORY.md             # Working memory (updated across sessions)

agents/                 # Optional — Sub-agents
  {name}/               # Each sub-agent is a full agent definition
    agent.yaml
    IDENTITY.md
    ...

workflows/              # Optional — Multi-step deterministic flows
  {name}.yaml           # Workflow definition

config/                 # Optional — Environment-specific overrides
  default.yaml
  {environment}.yaml
```

---

## Required Files

### `agent.yaml`

The agent manifest. Declares identity, model preferences, capabilities, and runtime hints.

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/AITFund/agent-exoskeleton/main/spec/schemas/agent.schema.json
spec_version: "0.1.0"

name: "Agent Name"
version: "1.0.0"
description: "One-line description of what this agent does"

# Model preferences — generic aliases, not vendor-specific IDs
model:
  preferred: claude-sonnet        # Primary model
  fallback: claude-haiku          # Fallback if preferred unavailable
  constraints:
    temperature: 0.7              # 0.0-1.0
    max_tokens: 8192              # Max output tokens

# Skills this agent has (directory names under skills/)
skills:
  - web-research
  - summarization

# Tools this agent can use (file names under tools/, or well-known tool names)
tools:
  - web_search
  - web_fetch
  - bash
  - file_read
  - file_write

# Sub-agents (directory names under agents/)
agents:
  fact-checker:
    description: "Verifies claims before including them in output"
    delegation: auto              # auto | manual | disabled

# Communication configuration
communication:
  channels:                       # Channels this agent is designed for
    - whatsapp
    - telegram
    - slack
    - discord
  formatting:                     # Channel-specific formatting rules
    whatsapp:
      bold: "*text*"
      italic: "_text_"
      headings: false
      links: false
    slack:
      bold: "*text*"
      italic: "_text_"
      headings: false
      links: "<url|text>"
    discord:
      bold: "**text**"
      italic: "*text*"
      headings: true
      links: "[text](url)"

# Memory configuration
memory:
  strategy: file-based            # file-based | database | none
  auto_save: true                 # Whether agent should persist learnings

# Runtime hints (informational — adapters may use or ignore)
runtime:
  container: true                 # Expects to run in a sandbox/container
  network: true                   # Needs network access
  filesystem: read-write          # none | read-only | read-write
  max_turns: 200                  # Max conversation turns

# Metadata
metadata:
  author: "Your Name"
  license: "MIT"
  repository: "https://github.com/org/repo"
  tags:
    - personal-assistant
    - research
```

**Field reference:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `spec_version` | yes | string | Specification version (semver) |
| `name` | yes | string | Agent display name |
| `version` | yes | string | Agent version (semver) |
| `description` | yes | string | One-line description |
| `model` | no | object | Model preferences and constraints |
| `model.preferred` | no | string | Preferred model alias |
| `model.fallback` | no | string | Fallback model alias |
| `model.constraints` | no | object | Temperature, max_tokens, etc. |
| `skills` | no | string[] | Skill directory names |
| `tools` | no | string[] | Tool names (directory names or well-known) |
| `agents` | no | object | Sub-agent declarations |
| `communication` | no | object | Channel and formatting config |
| `memory` | no | object | Memory strategy config |
| `runtime` | no | object | Runtime environment hints |
| `metadata` | no | object | Author, license, tags |

### Model Aliases

Use generic aliases for portability. Adapters map these to vendor-specific IDs.

| Alias | Intent |
|-------|--------|
| `claude-opus` | Most capable Claude model |
| `claude-sonnet` | Balanced Claude model |
| `claude-haiku` | Fast/cheap Claude model |
| `gpt-4o` | Most capable OpenAI model |
| `gpt-4o-mini` | Fast/cheap OpenAI model |
| `gemini-pro` | Most capable Gemini model |
| `gemini-flash` | Fast/cheap Gemini model |
| `local` | Local model (Ollama, llama.cpp, etc.) |

Adapters SHOULD accept both aliases and raw vendor IDs. Unknown aliases pass through as-is.

---

### `IDENTITY.md`

Free-form Markdown defining the agent's identity. This is the "soul" of the agent — personality, expertise, communication style, values.

**Structure is flexible**, but the following sections are recommended:

```markdown
# {Agent Name}

{One paragraph: who the agent is and what it does.}

## Expertise
{Domain knowledge, specializations, what the agent is particularly good at.}

## Communication Style
{How the agent communicates — tone, verbosity, formatting preferences.}

## Values
{What the agent prioritizes — accuracy, speed, creativity, safety, etc.}
```

**Guidelines:**
- Write in second person ("You are...") — this becomes the agent's self-description
- Be specific about domain expertise — vague identities produce vague behavior
- Communication style directly affects output quality — be prescriptive
- Keep under 500 lines — this is loaded into every conversation

---

## Optional Components

### Rules (`rules/`)

Behavioral constraints that limit what the agent does. Separate from identity (which describes what the agent *is*).

**`rules/RULES.md`** — general rules applied to all contexts:

```markdown
# Rules

## Must Always
- Cite sources when making factual claims
- Ask for clarification when a request is ambiguous

## Must Never
- Make up information or hallucinate sources
- Execute destructive operations without confirmation

## Output Constraints
- Keep responses under 2000 characters unless asked for detail
- Use bullet points for lists of 3+ items
```

Additional rule files (`rules/safety.md`, `rules/compliance.md`) are loaded alongside `RULES.md`. Use these to separate concerns.

---

### Skills (`skills/`)

A skill is a capability the agent has — a defined behavior with instructions. Each skill lives in its own directory with a `SKILL.md` file.

**`skills/{name}/SKILL.md`** format:

```markdown
---
name: web-research
description: Search the web, cross-reference sources, and produce cited reports
version: 1.0.0
tools:
  - web_search
  - web_fetch
  - browser
triggers:
  - "research"
  - "find information about"
  - "look up"
---

# Web Research

{Detailed instructions for how the agent should perform this skill.}

## Process
1. ...
2. ...

## Output Format
...
```

**Frontmatter fields:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | yes | string | Skill identifier (matches directory name) |
| `description` | yes | string | One-line description (~100 tokens for routing) |
| `version` | no | string | Skill version |
| `tools` | no | string[] | Tools this skill needs |
| `triggers` | no | string[] | Phrases/patterns that activate this skill |

**Skill body** is free-form Markdown instructions. Be explicit — this is what the agent follows when executing the skill.

Skills MAY include additional files (scripts, templates, examples) in their directory. Reference them by relative path in the instructions.

---

### Tools (`tools/`)

Tool definitions describe external capabilities the agent can invoke. Each tool is a YAML file with a name, description, and input schema.

**`tools/{name}.yaml`** format:

```yaml
name: web_search
description: Search the web and return results with titles, URLs, and snippets
input_schema:
  type: object
  properties:
    query:
      type: string
      description: The search query
    max_results:
      type: integer
      description: Maximum number of results to return
      default: 10
  required:
    - query
```

Tool definitions are **declarative** — they describe the interface, not the implementation. Runtimes provide the actual tool execution.

Well-known tools (like `bash`, `file_read`, `web_search`) don't need definitions — list them in `agent.yaml` under `tools` and the adapter will map them to the runtime's built-in tools.

---

### Knowledge (`knowledge/`)

Reference documents the agent can access. An `index.yaml` file controls which documents are loaded and when.

**`knowledge/index.yaml`**:

```yaml
documents:
  - path: product-catalog.md
    description: Current product catalog with pricing
    always_load: true       # Injected into system prompt
  - path: api-reference.md
    description: REST API documentation
    always_load: false      # Available on demand
```

Documents with `always_load: true` are included in every conversation. Use sparingly — these consume tokens. Other documents are referenced by the agent when relevant.

---

### Memory (`memory/`)

Persistent state across sessions.

**`memory/MEMORY.md`** — working memory the agent reads and updates:

```markdown
# Memory

## User Preferences
- Prefers concise responses
- Timezone: America/New_York

## Learned Context
- Project X uses PostgreSQL, not MySQL
- Deploy window is Tuesdays 2-4pm EST
```

Memory is **mutable** — the agent updates it as it learns. The format is intentionally free-form to accommodate different memory strategies.

---

### Sub-agents (`agents/`)

Each sub-agent is a full agent definition in a subdirectory. Sub-agents inherit nothing from the parent — they are self-contained.

```
agents/
  fact-checker/
    agent.yaml
    IDENTITY.md
    rules/
      RULES.md
```

Declared in the parent's `agent.yaml`:

```yaml
agents:
  fact-checker:
    description: "Verifies claims against reliable sources"
    delegation: auto          # auto | manual | disabled
```

**Delegation modes:**
- `auto` — parent agent delegates automatically when relevant
- `manual` — only delegates when explicitly instructed
- `disabled` — sub-agent defined but not active

---

### Workflows (`workflows/`)

Deterministic multi-step flows for repeatable processes.

**`workflows/{name}.yaml`**:

```yaml
name: research-report
description: Produce a sourced research report on a given topic
steps:
  - id: search
    prompt: "Search for recent information about {{ topic }}"
    tools: [web_search]
    outputs: [raw_results]

  - id: verify
    prompt: "Cross-reference these findings for accuracy"
    inputs: [search.raw_results]
    agent: fact-checker
    outputs: [verified_results]

  - id: compile
    prompt: "Write a report from the verified findings"
    inputs: [verify.verified_results]
    skill: summarization
    outputs: [report]
```

Workflows are optional and complementary to the agent's freeform capabilities. Use them for processes that should be consistent every time.

---

## Adapter Contract

Adapters transform an agent definition into a runtime-specific format. Every adapter MUST:

1. **Accept** a loaded agent definition (parsed `agent.yaml` + file contents)
2. **Return** a string (the runtime-specific output)
3. **Handle missing optionals** gracefully — only required files are guaranteed

Adapters SHOULD:
- Map model aliases to vendor-specific IDs
- Translate skills into the runtime's native format (system prompt sections, tool definitions, etc.)
- Include rules as behavioral constraints in the output
- Inject always-loaded knowledge documents
- Preserve the agent's communication/formatting preferences

Adapters MUST NOT:
- Require fields beyond what the spec marks as required
- Add runtime-specific fields to `agent.yaml`
- Modify the source agent definition

---

## Versioning

The spec follows semver. The `spec_version` field in `agent.yaml` declares compatibility.

- **Patch** (0.1.x): Clarifications, typo fixes, no structural changes
- **Minor** (0.x.0): New optional fields/directories, backward compatible
- **Major** (x.0.0): Breaking changes to required fields or structure

Adapters SHOULD check `spec_version` and warn on major version mismatches.
