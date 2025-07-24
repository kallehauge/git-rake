import type { GitBranch } from '@services/GitRepository.types.js'

export const BRANCH_OPERATIONS = {
  DELETE: 'delete',
  TRASH: 'trash',
  RESTORE: 'restore',
  PRUNE: 'prune',
} as const

export type BranchOperationType =
  (typeof BRANCH_OPERATIONS)[keyof typeof BRANCH_OPERATIONS]

export const UI_OPERATIONS = {
  DELETE: BRANCH_OPERATIONS.DELETE,
  TRASH: BRANCH_OPERATIONS.TRASH,
  RESTORE: BRANCH_OPERATIONS.RESTORE,
} as const

export type UIOperationType = (typeof UI_OPERATIONS)[keyof typeof UI_OPERATIONS]

export type ConfirmationConfig = {
  type: 'alert' | 'warning' | 'info'
  confirmText: string
  cancelText: string
  message?: string
}

export type UseBranchesOperationsReturn = {
  performOperation: (
    operation: BranchOperationType,
    branches: GitBranch[],
  ) => Promise<void>
  pendingOperation: UIOperationType | null
  startConfirmation: (operation: UIOperationType) => void
  handleConfirm: (
    selectedBranches: GitBranch[],
    onRefresh: () => Promise<void>,
  ) => Promise<void>
  handleCancel: () => void
  confirmationConfig: ConfirmationConfig | null
}
