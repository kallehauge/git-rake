import type { AppTheme } from './themes.types.js'
export type { AppTheme }

// Import all theme families
import { autoTheme } from './families/auto.js'
import { oneLight, oneDark } from './families/one.js'
import { githubLight, githubDark } from './families/github.js'
import { catppuccinLatte, catppuccinMocha } from './families/catppuccin.js'
import { gruvboxLight, gruvboxDark } from './families/gruvbox.js'
import { tokyoNight, tokyoNightDay } from './families/tokyoNight.js'
import { ayuLight, ayuDark, ayuMirage } from './families/ayu.js'
import { draculaTheme } from './families/dracula.js'
import { vscodeLight, vscodeDark } from './families/vscode.js'

// Theme registry - maintain backward compatibility with old keys
export const availableThemes: Record<string, AppTheme> = {
  auto: autoTheme,
  'one-light': oneLight,
  'one-dark': oneDark,
  'github-light': githubLight,
  'github-dark': githubDark,
  'catppuccin-latte': catppuccinLatte,
  'catppuccin-mocha': catppuccinMocha,
  'gruvbox-light': gruvboxLight,
  'gruvbox-dark': gruvboxDark,
  'tokyo-night': tokyoNight,
  'tokyo-night-day': tokyoNightDay,
  'ayu-light': ayuLight,
  'ayu-dark': ayuDark,
  'ayu-mirage': ayuMirage,
  dracula: draculaTheme,
  'vscode-light': vscodeLight,
  'vscode-dark': vscodeDark,
}

// Main theme getter function - same API as before
export function getTheme(themeName: string): AppTheme {
  return availableThemes[themeName] ?? availableThemes.auto
}

// Get all themes function - same API as before
export function getAllThemes(): AppTheme[] {
  return Object.values(availableThemes)
}
