# Today Query

An Obsidian plugin that renders custom markdown content at the bottom of today's daily note.

## Features

- Injects configurable markdown content at the bottom of today's daily note
- Works in both source/live preview and reading mode
- Supports the [Daily Notes Editor](https://github.com/Quorafind/Obsidian-Daily-Notes-Editor) plugin
- Inserts content before the backlinks section
- Content is rendered as markdown, so any code block or plugin syntax (e.g. `todoseq`, `dataview`) works

## Usage

1. Install and enable the plugin
2. Go to Settings > Today Query
3. Enter the markdown content you want to appear at the bottom of today's daily note
4. Open today's daily note - the content will be rendered below the note

## Configuration

The plugin reads your Daily Notes core plugin settings (date format and folder) to detect today's note. No additional date configuration is needed.

## Installing

Copy `main.js`, `styles.css`, and `manifest.json` to your vault at `VaultFolder/.obsidian/plugins/obsidian-today-query/`.

## Development

- `pnpm install` to install dependencies
- `pnpm run dev` to start compilation in watch mode
- `pnpm run build` to build for production
