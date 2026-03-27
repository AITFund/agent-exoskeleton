---
name: browser-automation
description: Browse websites interactively — open pages, click elements, fill forms, take screenshots, extract data
version: 1.0.0
tools:
  - browser
  - bash
triggers:
  - "browse"
  - "open the website"
  - "go to"
  - "take a screenshot"
  - "fill out the form"
---

# Browser Automation

Use `agent-browser` to interact with web pages in a real browser environment.

## Quick Reference

```bash
agent-browser open <url>              # Open a page
agent-browser snapshot -i             # See interactive elements (@e1, @e2, ...)
agent-browser click @e3               # Click an element
agent-browser fill @e5 "text"         # Fill a form field
agent-browser screenshot              # Take a screenshot
agent-browser pdf                     # Save page as PDF
```

## Process

1. Open the target URL with `agent-browser open <url>`
2. Take a snapshot with `agent-browser snapshot -i` to see interactive elements
3. Elements are labeled with references like `@e1`, `@e2` — use these in commands
4. Interact as needed (click, fill, scroll, screenshot)
5. Extract the data or confirm the action completed

## Guidelines

- Always snapshot after navigation to see what's on the page
- Use screenshots when the user needs visual confirmation
- For multi-step forms, snapshot after each submission to verify success
