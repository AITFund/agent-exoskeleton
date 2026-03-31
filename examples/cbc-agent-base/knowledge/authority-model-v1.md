# Authority Model v1

Portable authority/governance pattern for OpenClaw-style assistants.

## Goal

Treat the assistant like a privileged operational identity, not just a chatbot. The system should decide what it may do based on:

1. who is asking
2. where they are asking from
3. what kind of action is being requested
4. what information domain the request touches
5. who the outbound recipient is

## Core best practices

### Identity-based authority, not channel trust
Do not trust a request just because it came from email, Telegram, or WhatsApp. Trust comes from matching the sender to a verified principal.

### Separate three things
- lookup authority
- execution authority
- disclosure authority

These should not be treated as the same permission. In practice, all three should still be filtered by domain scope, privacy rules, and recipient policy.

### Use assistant-owned accounts with delegated access
Prefer authenticating the assistant as itself, then grant it delegated/shared access where needed.

### Deny by default
Unknown principals, unknown groups, and unlisted privileged action classes should be denied unless explicitly allowed.

### Separate outbound recipient control from web research
- research/read web activity can remain broadly allowed
- write/exfil/upload/webhook activity should be controlled more tightly

## Recommended policy files
- `policy/principals.example.yml`
- `policy/action-classes.example.yml`
- `policy/group-authorizations.example.yml`
- `policy/outbound-policy.example.yml`

## Group rule model
For group chats, decide permissions by:
1. group identity
2. principal identity
3. action class

Do not rely on group membership alone. Group authorization should never override global control-plane restrictions, privacy checks, or unknown-recipient rules.
