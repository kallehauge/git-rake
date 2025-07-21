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

export const availableThemes: Record<string, AppTheme> = {
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

export function getTheme(themeName: string): AppTheme {
  return availableThemes[themeName] ?? availableThemes.auto
}

export function getAllThemes(): AppTheme[] {
  return Object.values(availableThemes)
}
