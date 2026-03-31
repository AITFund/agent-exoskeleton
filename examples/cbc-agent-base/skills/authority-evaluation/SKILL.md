---
name: authority-evaluation
description: Evaluate whether a principal is authorized to request a lookup, action, or disclosure using the principal registry, action classes, group authorization, and outbound policy.
version: 1.0.0
tools: [file_read]
triggers: ["authority", "allowed", "can I", "policy", "who is allowed"]
---

# Authority Evaluation

1. Identify the principal and confidence of identity match.
2. Classify the requested action.
3. Check domain scope and disclosure rules.
4. If the request is in a group, check group-plus-principal authorization.
5. If outbound, check recipient policy.
6. If ambiguous, escalate instead of guessing.
