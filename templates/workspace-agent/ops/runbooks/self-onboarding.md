# Workspace agent self-onboarding

This runbook is safe for public repos. Replace placeholders in a private overlay.

## Ask the human for

1. Confirmation that your agent user has been added to the workspace.
2. Your API key through the approved secure channel.
3. Which docs, channels, inboxes, and task queues you own.
4. Which actions need explicit approval.
5. Whether you should run a poller, and at what cadence.

## Local setup

- Install the workspace CLI or SDK.
- Store the API key outside the repo with owner-only permissions.
- Create a wrapper that loads the token without printing it.
- Verify identity with a harmless `whoami` call.
- Verify doc, task, mail, comment, and permission read-back paths.

## Operating loop

- Poll direct mentions, assignments, DMs, and direct mail only.
- Ignore ambient visible activity.
- Re-emit direct events until an action receipt exists.
- Record action, blocker, or no-op receipts.
- Report in the workspace object that originated the request when permissions allow.
