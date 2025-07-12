# Git Rake 🍂

An interactive CLI tool to safely prune, delete, and restore Git branches with a rich terminal UI.

Built with [Ink](https://github.com/vadimdemedes/ink) for React-style terminal interfaces and TypeScript for type safety.

## Features

- 🎯 **Interactive Branch Browser** - Navigate branches with visual indicators
- 🗑️ **Safe Deletion** - Branches moved to trash namespace for easy restoration
- 🔍 **Fuzzy Search** - Quick branch finding with `/` key
- 📊 **Detailed view** - See commit history and branch details
- ⚡ **Batch Operations** - Select multiple branches for bulk operations
- 🎨 **Themeable** - Light, dark, and auto themes
- 🔄 **Dry Run Mode** - Preview operations before executing
- 📅 **Stale Detection** - Automatically identify old branches

## Installation

```bash
npm install -g git-rake
```

Or run directly with npx:
```bash
npx git-rake
```

## Usage

### Interactive Mode (Default)
```bash
git-rake
# or
git-rake clean
```

### Keyboard Controls
- `↑/↓` - Navigate branches
- `Space` - Select/deselect branch for batch operations
- `/` - Enter search mode
- `f` - Cycle filters (all/merged/stale/unmerged)
- `d` - Delete selected branches
- `Esc`- Cancel current operation
- `Ctrl+C` - Exit

### Command Line Options

```bash
# Clean branches with dry run
git-rake clean --dry-run

# Include remote tracking branches
git-rake clean --include-remote

# Restore deleted branches interactively
git-rake restore

# Restore specific branch
git-rake restore my-feature-branch

# List branches in trash
git-rake trash

# Clean up old trash entries
git-rake cleanup

# Generate example config
git-rake config
```

## Configuration

Create a `.gitrakerc`, `.gitrakerc.yml`, or `.gitrakerc.yaml` file:

```yaml
# Number of days before a branch is considered stale
staleDaysThreshold: 30

# Namespace for storing deleted branches
trashNamespace: "refs/rake-trash"

# Number of days to keep deleted branches in trash
trashTtlDays: 90

# Theme: "light", "dark", or "auto"
theme: "auto"

# Include remote tracking branches in the list
includeRemote: false

# Automatically cleanup old trash entries on startup
autoCleanupTrash: true
```

## How It Works

### Trash System
Instead of permanently deleting branches, git-rake moves them to a special namespace (`refs/rake-trash/*`). This allows for:
- Safe restoration of accidentally deleted branches
- Automatic cleanup after configurable TTL
- No impact on repository size (refs are lightweight)

### Filters
- **All**: Show all local branches
- **Merged**: Show only merged branches
- **Stale**: Show only stale branches (based on staleDaysThreshold)
- **Unmerged**: Show only unmerged branches

## Git Alias Setup

To use git-rake as a git subcommand:

```bash
git config --global alias.rake '!git-rake'
```

Then use:
```bash
git rake
git rake clean --dry-run
git rake restore
```

## Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Run development mode against different Git repo
npm run dev -- --cwd /path/to/repo

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

## Requirements

- Node.js ≥14
- Git

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run lint` and `npm run typecheck`
6. Submit a pull request
