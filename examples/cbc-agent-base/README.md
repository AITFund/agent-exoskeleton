# CBC Agent Base

A reusable, security-first base definition for a multi-channel personal assistant / executive operator.

This example is intentionally **redacted**. It shows the architecture and policy pattern, not a real deployment.

## What kind of agent this is

CBC-style agents are:
- multi-channel personal assistants
- proactive operators with memory and automations
- strong at research, scheduling, communication, and follow-through
- designed to work with real authority while staying within explicit guardrails

## Core design ideas

- **Identity-based authority** instead of trusting channels blindly
- Separate **lookup**, **execution**, and **disclosure** authority
- **Deny by default** for unknown principals, groups, and privileged actions
- Prefer **assistant-owned accounts + delegated access**
- Use explicit **recipient controls** for outbound email and messaging
- Keep broad **read/research web access**, but stage tighter controls for write/exfil paths

## Public vs private split

This directory is the **public base**. It is safe to publish because it contains:
- generic agent identity
- generic rules
- generalized authority-model guidance
- example policy schemas with placeholder principals

A real deployment should add a **private overlay** with:
- real principal identities
- real recipient policies
- real group identifiers
- real allowed domains
- deployment-specific notes
- secrets and auth material kept outside the repo or in a private repo only

## Suggested usage pattern

1. Copy this example as a starting point.
2. Customize `IDENTITY.md` for your agent persona.
3. Replace the example policy files with private real ones.
4. Export with `agent-exo export` to your runtime.

## Files

- `agent.yaml` — base agent manifest
- `IDENTITY.md` — portable CBC-style identity
- `rules/RULES.md` — behavioral rules
- `knowledge/authority-model-v1.md` — generalized authority model
- `policy/*.example.yml` — redacted example policy files

## Important

Do **not** publish your real principal registry, real group authorizations, or real outbound allowlists in a public repo.
