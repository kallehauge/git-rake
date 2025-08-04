import { type StatusBarType } from './StatusBar.types.js'
import { type AppTheme } from '@utils/themes/themes.types.js'

export function getStatusBarTypeColor(
  type: StatusBarType,
  theme: AppTheme,
): string {
  switch (type) {
    case 'warning':
      return theme.colors.warning
    case 'alert':
      return theme.colors.error
    case 'success':
      return theme.colors.success
    default:
      return theme.colors.primary
  }
}
