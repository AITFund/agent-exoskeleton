# Agent Exoskeleton

Lightweight, git-native standard for defining AI agents. Runtime-agnostic. Your repo is your agent.

## What This Is

A specification and toolkit for defining AI agents as portable, version-controlled definitions. Two files define an agent (`agent.yaml` + `IDENTITY.md`). Adapters export those definitions to any runtime (Claude Code, OpenAI, or raw system prompt).

**This is not a runtime.** It defines agents. Runtimes run them.

## Quick Start

```bash
# Install
npm install agent-exoskeleton

# Scaffold a new agent
npx agent-exo init my-agent

# Edit the definition
# - my-agent/agent.yaml    (manifest: name, skills, tools, model)
# - my-agent/IDENTITY.md   (personality, expertise, communication style)

# Validate
npx agent-exo validate my-agent

# Export to Claude Code format
npx agent-exo export my-agent --adapter claude-code --out CLAUDE.md

# Export to OpenAI system prompt
npx agent-exo export my-agent --adapter openai --out system-prompt.md
```

## Agent Structure

```
my-agent/
  agent.yaml              # REQUIRED — Manifest (name, model, skills, tools)
  IDENTITY.md             # REQUIRED — Who the agent is (personality, expertise)
  rules/                  # Optional — Behavioral constraints
    RULES.md
  skills/                 # Optional — Capabilities with instructions
    web-research/
      SKILL.md
  tools/                  # Optional — Tool interface definitions
    web_search.yaml
  knowledge/              # Optional — Reference documents
    index.yaml
    product-catalog.md
  memory/                 # Optional — Persistent state
    MEMORY.md
  agents/                 # Optional — Sub-agent definitions
    fact-checker/
      agent.yaml
      IDENTITY.md
  workflows/              # Optional — Multi-step deterministic flows
    research-report.yaml
```

Only `agent.yaml` and `IDENTITY.md` are required. Everything else is additive.

## agent.yaml

```yaml
spec_version: "0.2.0"
name: "MyAgent"
version: "1.0.0"
description: "What this agent does in one line"

model:
  preferred: claude-sonnet      # Generic aliases — adapters map to vendor IDs
  fallback: claude-haiku

skills:
  - web-research                # Directory names under skills/

tools:
  - web_search                  # Well-known tool names or definitions under tools/
  - bash

communication:
  channels: [whatsapp, slack]
  formatting:                   # Per-channel formatting rules
    whatsapp:
      bold: "*text*"
      headings: false
    slack:
      bold: "*text*"
      links: "<url|text>"

memory:
  strategy: file-based

runtime:
  container: true
  network: true
  filesystem: read-write
```

See [spec/SPECIFICATION.md](spec/SPECIFICATION.md) for the full schema reference.

## IDENTITY.md

```markdown
# MyAgent

You are a research specialist. You produce thorough, well-sourced
reports with citations.

## Communication Style
- Lead with findings, not process
- Always cite sources with URLs
```

This is the "soul" of the agent. Write in second person. Be specific about expertise and style.

## Skills

Each skill is a directory under `skills/` with a `SKILL.md` file:

```markdown
---
name: web-research
description: Search the web and produce cited reports
version: 1.0.0
tools: [web_search, web_fetch]
triggers: ["research", "look up"]
---

# Web Research

1. Formulate 2-3 search queries from different angles
2. Fetch and read the most relevant results
3. Cross-reference claims across sources
4. Present findings with source URLs
```

The YAML frontmatter provides metadata for routing (which skill to activate). The body provides execution instructions.

## Adapters

Adapters transform agent definitions into runtime-specific formats.

| Adapter | Output | Use Case |
|---------|--------|----------|
| `claude-code` | `CLAUDE.md` | Claude Code CLI, Claude Agent SDK, NanoClaw |
| `openai` | System prompt | OpenAI Chat API, OpenAI Agents SDK |
| `raw` | Concatenated Markdown | Any LLM, debugging, review |
| `hermes` | Hermes-oriented system prompt | Hermes Agent, cron/action loops, toolset-aware operators |
| `workspace-markdown` | Onboarding Markdown | Ambiguous, Notion, Google Docs, or other workspace docs |

```bash
# Export examples
npx agent-exo export my-agent --adapter claude-code --out CLAUDE.md
npx agent-exo export my-agent --adapter openai --out system-prompt.md
npx agent-exo export my-agent --adapter raw
```

### Programmatic usage

```typescript
import { loadAgent } from 'agent-exoskeleton';
import { exportClaudeCode } from 'agent-exoskeleton/adapters';

const agent = loadAgent('./my-agent');
const claudeMd = exportClaudeCode(agent);
```

## CLI Reference

```
agent-exo init <dir> [--template <name>]    Scaffold from template (default: minimal)
agent-exo validate <dir>                    Validate agent definition
agent-exo export <dir> --adapter <name>     Export to runtime format
agent-exo info <dir>                        Show agent summary
agent-exo adapters                          List available adapters
```

## Model Aliases

Generic aliases keep definitions portable. Adapters map to vendor-specific IDs.

| Alias | Intent |
|-------|--------|
| `claude-opus` | Most capable Claude |
| `claude-sonnet` | Balanced Claude |
| `claude-haiku` | Fast/cheap Claude |
| `gpt-4o` | Most capable OpenAI |
| `gpt-4o-mini` | Fast/cheap OpenAI |
| `gemini-pro` | Most capable Gemini |
| `gemini-flash` | Fast/cheap Gemini |
| `local` | Local model (Ollama, etc.) |

## Example: Major (Content Manager)

A full working example is in [`examples/major-content-manager/`](examples/major-content-manager/). This is a real agent definition reverse-engineered from a production NanoClaw deployment.

```bash
# See what it contains
npx agent-exo info examples/major-content-manager

# Export to Claude Code format
npx agent-exo export examples/major-content-manager --adapter claude-code

# Validate it
npx agent-exo validate examples/major-content-manager
```


## Operating Exoskeleton

Production agents need more than identity and skills. Agent Exoskeleton now supports optional public operating shape:

```text
policy/          # authority, principals, action classes, recipient controls
connections/     # required credential surfaces and redacted validation steps
ops/             # schedules, monitors, state contracts, runbooks
verification/    # read-back requirements for completed work
```

The key contract is: discovered activity is not the same as completed work. Agents should record action receipts that prove each direct request was acted, blocked, or explicitly no-op with a reason.

Shared workspaces should also declare activation posture. For most executive operators the safe default is `direct_only`: respond only to direct mentions, assignments, DMs, or explicit owner instructions, not ambient visible activity.

```yaml
communication:
  activation:
    ambiguous:
      posture: direct_only
      respond_when: [direct_mention, direct_assignment, direct_message]
      ignore: [ambient_activity, visible_comments_not_addressed_to_agent]
```

## Git-Native Workflow

Agents are repos. Use standard git operations:

- **Fork** a template to create a variant
- **Branch** to experiment with personality or skills
- **Diff** to compare agent versions
- **PR** to propose changes to a shared agent
- **Tag** releases for stable versions

```bash
# Create a specialist from the Major template
cp -r examples/major-content-manager my-researcher
# Customize IDENTITY.md and skills
# Commit and push as a new repo
```

## Integration

Agent Exoskeleton is a definition layer. Runtimes consume its output:

```
agent.yaml + IDENTITY.md + skills/
        |
        v
    [adapter]
        |
        v
  CLAUDE.md / system-prompt.md / raw output
        |
        v
  [runtime: Claude Code, OpenAI, NanoClaw, etc.]
```

### NanoClaw Integration Example

```typescript
import { loadAgent } from 'agent-exoskeleton';
import { exportClaudeCode } from 'agent-exoskeleton/adapters';
import fs from 'fs';

// Load agent definition and export for the NanoClaw group
const agent = loadAgent('./agents/researcher');
const claudeMd = exportClaudeCode(agent);
fs.writeFileSync('./groups/researcher/CLAUDE.md', claudeMd);
// Register the group, link to a chat — done
```

## Contributing

1. Fork the repo
2. Create a branch for your change
3. Follow the spec in `spec/SPECIFICATION.md`
4. Validate your changes: `npx agent-exo validate <dir>`
5. Open a PR

### Adding an Adapter

Create `src/adapters/{name}.ts` exporting a function `(AgentDefinition) => string`. Register it in `src/adapters/index.ts`. The adapter must handle missing optionals gracefully — only `agent.yaml` and `IDENTITY.md` are guaranteed.

### Adding a Template

Create a directory under `templates/{name}/` with at minimum `agent.yaml` and `IDENTITY.md`. Templates should be self-contained and immediately valid (`agent-exo validate templates/{name}`).

## License

MIT
