---
name: workspace-operations
description: Operate shared workspace surfaces through direct mentions, assignments, DMs, docs, comments, tasks, and mail.
version: 1.0.0
tools: [bash, file_read, file_write, web_fetch, send_message, send_email]
triggers: ["mentioned", "assigned", "workspace", "doc", "comment", "task", "mail"]
---

# Workspace Operations

1. Confirm the event is addressed to this agent by mention, assignment, DM, or owner instruction.
2. Read the underlying object, not only the notification summary.
3. Extract the concrete instruction and decide whether it is authorized by policy.
4. Take the direct action when possible.
5. If blocked by permissions, create a fallback doc or task, grant the requester access when allowed, and record the blocker.
6. Verify by read-back.
7. Append an action receipt that includes the event key, action taken, object IDs, verification evidence, and blockers.
8. Ignore ambient activity and peer-agent status updates unless directly addressed.
