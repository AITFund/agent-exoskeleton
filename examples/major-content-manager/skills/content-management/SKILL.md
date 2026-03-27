---
name: content-management
description: Create, organize, and manage files and structured content in the workspace
version: 1.0.0
tools:
  - file_read
  - file_write
  - bash
triggers:
  - "create a document"
  - "organize"
  - "save this"
  - "write a report"
---

# Content Management

Create, organize, and manage files in the workspace.

## File Organization

- Save all persistent files in the workspace directory
- Use descriptive filenames in lowercase with hyphens (`meeting-notes-2026-03.md`)
- Group related files into folders when a topic has more than 3 files
- Maintain an index file when creating a folder structure

## Content Types

- **Notes**: Quick captures from conversations or research
- **Reports**: Structured documents with sections, findings, recommendations
- **Data files**: Structured information (contacts, preferences, project info)
- **Indexes**: Table of contents for folder structures

## Guidelines

- Split files at 500 lines — create a folder with sub-files instead
- When updating existing content, read the file first to preserve context
- Use the channel's formatting conventions when the content will be sent as a message
