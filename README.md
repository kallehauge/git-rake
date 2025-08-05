# Git Rake 🍂

Git Rake, the interactive TUI that simplifies cleaning up branches.

Although you can completely skip the feature entirely, then Rake also introduces a new "**trash system**" that will move your local branches from `refs/head/*` to a new `refs/rake-trash` (it happens behind the scenes). This allows you to, safely, be more aggresive with cleaning up branches you're unsure if you want to keep around.

![Demo of Git Rake](https://raw.githubusercontent.com/kallehauge/git-rake/main/docs/assets/demo.gif)

## Features

- 🎯 **Interactive Branch Browser** - Navigate branches with visual indicators
- ⚡ **Batch Operations** - Select multiple branches for bulk operations (delete, trash, restore)
- 🔍 **Search** - Quick branch finding with `/` key
- 🗂️ **Filter** - Select filters to easily do bulk operations on a full category (e.g. delete all merged branches)
  - `All`: Show all branches
  - `Merged`: Show merged branches
  - `Unmerged`: Show unmerged branches
  - `Stale`: Show stale branches (based on staleDaysThreshold)
  - `Selected`: Show branches selected for batch operation
- 📅 **Stale Detection** - Automatically identify old branches
- 🗑️ **Safe Deletion** - (Optional) Branches moved to trash namespace for easy restoration
- 🎨 **Themes** - Select between different "light" or "dark" themes inspired by existing color-schemes (VS Code, GitHub, and general themes like Tokyo Night, Catppuccin, and Gruvbox)
- 📊 **Detailed view** - See expanded commit history and branch details

## Installation

```bash
npm install -g git-rake
```

Or run directly with npx:
```bash
npx git-rake
```

_**Tip** - I'd personally recommend looking at the [Git Alias Setup](https://github.com/kallehauge/git-rake?tab=readme-ov-file#git-alias-setup) section for a more seamless command-flow._

### Requirements

- Node.js ≥14
- Git

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

_**Tip** - I'd personally recommend looking at the [Git Alias Setup](https://github.com/kallehauge/git-rake?tab=readme-ov-file#git-alias-setup) section for a more seamless command-flow._

### Keyboard Controls

#### Branches list

- `↑/↓` (or `j/k`) - Navigate branches
- `space` / `s` - Select/deselect branch for batch operations (_`S` will move the next selection upwards_)
- `a` - Select all branches that are being displayed
- `A` - Deselect all branches that are being displayed
- `/` - Enter search mode
- `f` - Cycle filters (all/merged/stale/unmerged)
- `t` - Trash selected branches (soft delete)
- `d` - Delete selected branches (permanent)
- `r` - Restore selected branches (in restore mode)
- `v` - View more details about a specific branch
- `Esc` - Cancel current operation (_e.g. clear search query_)
- `Ctrl+c` - Exit

#### Confirmation prompt

- `↑/↓` - Navigate branches
- `space` / `s` - Last chance to review and deselect/remove branches you do not want to <delete|trash|restore>
- `y` / `Enter` - Approve operation (<delete|trash|restore>)
- `n` / `Esc` - Cancel operation (<delete|trash|restore>)
- `Ctrl+c` - Exit

## Configuration

Make Git Rake fit your own workflow!

Git Rake looks for configuration files in two locations (the actual file format can be any of `.gitrakerc`, `.gitrake.config.js`, `.gitrakerc.yml`, or any other format supported to [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig)):

1. Home: `~/.gitrakerc`
2. Project: `/my/project/root/.gitrakerc`

Any configuration that is defined in a project will override user configuration (think: you define your prefered `theme` in the user configuration and then define `mergeCompareBranch` and `excludedBranches` in projects that needs some modification to work).

**Tip - add `.gitrakerc` to global Git ignore:**

I consider Git Rake a personal tool that projects shouldn't know about, so I have added all `.gitrakerc` files to my global ignore file.
If you don't have global ignore file already, then you can register one like this:

```bash
git config --global core.excludesfile ~/.gitignore
```

### Example `.gitrakerc` file

```yaml
# Theme: use the default `auto` theme that tries to give as wide support as possible based on your terminal's own colors.
# Alternatively, you can also choose from these:
# - Light themes: "github-light", "catppuccin-latte", "gruvbox-light", "tokyo-night-day", "vscode-light"
# - Dark themes: "catppuccin-mocha", "gruvbox-dark", "tokyo-night", "ayu", "dracula", "vscode-dark"
theme: "tokyo-night"

# Number of days before a branch is considered stale.
staleDaysThreshold: 30

# Disable automatic cleanup of trashed branches that are past their TTL.
autoCleanupTrash: false

# Number of days to keep deleted branches in trash before they get cleaned up
# via `autoCleanupTrash` or manually with the `git rake trash --prune` command.
trashTtlDays: 90

# The branch the tool will use to compare if other branches are already merged.
# Based on my own experience, this is typically a "develop" branch since, when
# we work, we do so against that branch - but it's up to you and your flow!
mergeCompareBranch: "develop"

# Branches to exclude from git rake operations (they'll never be shown or selectable).
excludedBranches: ["main", "master", "develop", "staging"]
```

## Git Alias Setup

There are generally two ways you can setup Git Rake as a Git alias (or combine them):

Add `rake` as an alias:

```bash
git config --global alias.rake '!git-rake'
```

This will allow you to run subcommands using `git rake <command>`:

```bash
git rake trash              # Interactive branch management
git rake restore            # Interactive restore mode
git rake trash --prune      # Prune trashed branches that are past TTL
```

A more direct way would be to add the subcommands directly:

```bash
git config --global alias.trash '!git-rake trash'
git config --global alias.restore '!git-rake restore'
```

This will allow you to ignore the `rake` top-level command and feel even more integrated into Git itself:

```bash
git trash                   # Interactive branch management
git restore                 # Interactive restore mode
```

## Contributing

[See more in the development docs](https://github.com/kallehauge/git-rake/blob/main/docs/development.md) (WIP)

## Appreciation

This project is built using:

* [Ink](https://github.com/vadimdemedes/ink) - used to create a TUI with React and TypeScript for type safety
* [Ink Fullscreen](https://github.com/DaniGuardiola/fullscreen-ink) - used to trigger a fullscreen alternate buffer screen
* [Commander.js](https://github.com/tj/commander.js) - used to register CLI Commands
* [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) - used to easily load and support different config formats
