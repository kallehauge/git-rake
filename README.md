# Git Rake 🍂

An interactive CLI tool to safely prune, delete, and restore Git branches with a rich terminal UI.

Built with [Ink](https://github.com/vadimdemedes/ink) for React-style terminal interfaces and TypeScript for type safety.

## Features

- 🎯 **Interactive Branch Browser** - Navigate branches with visual indicators
- 🗑️ **Safe Deletion** - Branches moved to trash namespace for easy restoration
- 🔍 **Fuzzy Search** - Quick branch finding with `/` key
- 📊 **Detailed view** - See commit history and branch details
- ⚡ **Batch Operations** - Select multiple branches for bulk operations
- 🎨 **Themes** - Popular themes inspired by programs like VS Code, GitHub, Atom, and general themes like Tokyo Night, Catppuccin, and Gruvbox
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

### Available Commands
```bash
git-rake                    # Show command help
git-rake trash              # Interactive branch management (trash/delete)
git-rake branch             # Alias for trash command
git-rake trash --list       # List trashed branches
git-rake trash --prune      # Prune trashed branches that are past TTL
git-rake trash <branch>     # Move specific branch to trash
git-rake restore            # Interactive restore mode
git-rake restore <branch>   # Restore specific branch
```

### Interactive Mode
```bash
# Enter interactive branch management
git-rake trash
# or using the alias
git-rake branch
```

### Keyboard Controls
- `↑/↓` - Navigate branches
- `Space` - Select/deselect branch for batch operations
- `/` - Enter search mode
- `f` - Cycle filters (all/merged/stale/unmerged)
- `t` - Trash selected branches (soft delete)
- `d` - Delete selected branches (permanent)
- `r` - Restore selected branches (in restore mode)
- `Esc`- Cancel current operation
- `Ctrl+C` - Exit

### Command Examples

```bash
# Interactive branch management
git-rake trash
git-rake branch  # An alias that does the same as `trash`

# List trashed branches
git-rake trash --list

# Prune trashed branches that are past TTL
git-rake trash --prune

# Move specific branch to trash
git-rake trash feature-branch

# Restore deleted branches interactively
git-rake restore

# Restore specific branch
git-rake restore my-feature-branch
```

## Themes

Git Rake comes with themes inspired by popular editors and terminal color schemes:

### Adaptive
- **Auto** - Adapts to your terminal colors

### Light Themes
- **One (light)** - Atom's beloved light theme with perfect contrast
- **GitHub (light)** - GitHub's clean design system
- **Catppuccin (latte)** - Warm soothing pastels
- **Gruvbox (light)** - Retro warm colors
- **Tokyo Night (day)** - Popular VS Code light theme
- **Ayu (light)** - Clean minimalist design
- **VS Code (light)** - Visual Studio Code's default light theme

### Dark Themes
- **One (dark)** - Atom's iconic dark theme loved by millions
- **GitHub (dark)** - GitHub's modern dark design
- **Catppuccin (mocha)** - Trendy 2025 pastel dark theme
- **Gruvbox (dark)** - Beloved retro community favorite
- **Tokyo Night** - Most popular VS Code/Vim theme
- **Ayu (dark)** - Minimalist dark elegance
- **Ayu (mirage)** - Unique balanced variant
- **Dracula** - Vibrant purple/pink classic
- **VS Code (dark)** - Visual Studio Code's default dark theme

## Configuration

Create a `.gitrakerc`, `.gitrakerc.yml`, or `.gitrakerc.yaml` file:

```yaml
# Number of days before a branch is considered stale
staleDaysThreshold: 30

# Number of days to keep deleted branches in trash
trashTtlDays: 90

# Theme: Choose from 17 beautiful themes
# Light themes: "auto", "one-light", "github-light", "catppuccin-latte", "gruvbox-light", "tokyo-night-day", "ayu-light", "vscode-light"
# Dark themes: "one-dark", "github-dark", "catppuccin-mocha", "gruvbox-dark", "tokyo-night", "ayu-dark", "ayu-mirage", "dracula", "vscode-dark"
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
git rake trash              # Interactive branch management
git rake restore            # Interactive restore mode
git rake trash --prune      # Prune trashed branches that are past TTL
```

### Suggested Git Aliases

```bash
# Common aliases for branch management
git config --global alias.trash '!git-rake trash'
git config --global alias.restore '!git-rake restore'
git config --global alias.prune-trash '!git-rake trash --prune'
```

Then use:
```bash
git trash                   # Interactive branch management
git restore                 # Interactive restore mode
git prune-trash             # Prune trashed branches that are past TTL
```

## Development

```bash
# Install dependencies
npm install

# Development mode
# Using "dev", the app enables React DevTools integration and profiling.
When DEV=true is set, the app enables React DevTools integration and profiling.
npm run dev
npx react-devtools

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
