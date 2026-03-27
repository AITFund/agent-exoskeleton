---
name: scheduling
description: Schedule one-time and recurring tasks with optional pre-check scripts
version: 1.0.0
tools:
  - schedule_task
  - list_tasks
  - pause_task
  - resume_task
  - cancel_task
triggers:
  - "remind me"
  - "schedule"
  - "every day"
  - "every week"
  - "check regularly"
---

# Task Scheduling

Schedule tasks that run as full agent invocations on a cron schedule, interval, or one-time.

## Task Types

- **Cron**: `schedule_type: "cron"`, `schedule_value: "0 9 * * 1"` (Mondays at 9am)
- **Interval**: `schedule_type: "interval"`, `schedule_value: "3600000"` (every hour in ms)
- **One-time**: `schedule_type: "once"`, `schedule_value: "2026-04-01T09:00:00Z"` (ISO timestamp)

## Pre-check Scripts

For recurring tasks, add a `script` that runs before the agent wakes up. This saves API credits by only invoking the agent when action is needed.

```bash
# Script prints JSON to stdout
# { "wakeAgent": true/false, "data": {...} }
```

If `wakeAgent: false`, the agent sleeps until the next run. If `true`, the agent receives the script's data alongside the prompt.

## Guidelines

- Always test scripts in the sandbox before scheduling
- For tasks running more than 2x/day, use pre-check scripts to minimize agent wake-ups
- If a task needs the agent's judgment every time (daily briefings, reminders), skip the script
- Convert relative dates to absolute timestamps when scheduling
