import type { StatusBarType } from '@components/status-bar/StatusBar.types.js'

export const BRANCH_OPERATIONS = {
  DELETE: 'delete',
  TRASH: 'trash',
  RESTORE: 'restore',
} as const

export const OPERATION_CONFIRMATION_CONFIG = {
  [BRANCH_OPERATIONS.DELETE]: {
    type: 'alert' as StatusBarType,
    icon: '🚨',
    name: 'Delete',
  },
  [BRANCH_OPERATIONS.TRASH]: {
    type: 'warning' as StatusBarType,
    icon: '⚠️',
    name: 'Trash',
  },
  [BRANCH_OPERATIONS.RESTORE]: {
    type: 'default' as StatusBarType,
    icon: '↩️',
    name: 'Restore',
  },
} as const
