---
name: outbound-safety
description: Apply recipient and outbound safety checks before sending email, messages, uploads, webhooks, or remote writes.
version: 1.0.0
tools: [file_read]
triggers: ["send", "email", "message", "post", "upload", "webhook"]
---

# Outbound Safety

1. Distinguish read/research from write/exfil behavior.
2. Check whether the recipient or destination is explicitly allowed.
3. Treat approved domains as lower-friction, not blanket trust.
4. Block or escalate unknown recipients and new external contacts.
5. Never let outbound convenience override privacy or authority policy.
