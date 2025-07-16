import { cosmiconfigSync } from 'cosmiconfig'
import { GitConfig } from '@services/GitRepository.js'

export interface AppTheme {
  name: string
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    text: string
    background: string
    border: string
  }
}

export interface GitRakeConfig extends GitConfig {
  theme: string
  includeRemote: boolean
  autoCleanupTrash: boolean
}

const defaultConfig: GitRakeConfig = {
  staleDaysThreshold: 30,
  trashNamespace: 'refs/rake-trash',
  trashTtlDays: 90,
  theme: 'auto',
  includeRemote: false,
  autoCleanupTrash: true,
}

const defaultThemes: Record<string, AppTheme> = {
  light: {
    name: 'light',
    colors: {
      primary: '#0066cc',
      secondary: '#6c757d',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      text: '#212529',
      background: '#ffffff',
      border: '#dee2e6',
    },
  },
  dark: {
    name: 'dark',
    colors: {
      primary: '#66b3ff',
      secondary: '#adb5bd',
      success: '#40d167',
      warning: '#ffdd57',
      error: '#ff6b8a',
      text: '#f8f9fa',
      background: '#212529',
      border: '#495057',
    },
  },
  auto: {
    name: 'auto',
    colors: {
      primary: 'blue',
      secondary: 'gray',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      text: 'white',
      background: 'black',
      border: 'gray',
    },
  },
}

export class ConfigLoader {
  private explorer = cosmiconfigSync('gitrake')

  loadConfig(): GitRakeConfig {
    const result = this.explorer.search()

    if (result) {
      return { ...defaultConfig, ...result.config }
    }

    return defaultConfig
  }

  getTheme(themeName: string): AppTheme {
    return defaultThemes[themeName] || defaultThemes.auto
  }

  getAllThemes(): AppTheme[] {
    return Object.values(defaultThemes)
  }

  saveConfig(config: Partial<GitRakeConfig>): void {
    // In a real implementation, this would save to .gitrakerc
    // For now, we'll just log what would be saved
    console.log('Would save config:', config)
  }
}

export function createExampleConfig(): string {
  return `# Git Rake Configuration
# This file can be named .gitrakerc, .gitrakerc.yml, or .gitrakerc.yaml

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
`
}
