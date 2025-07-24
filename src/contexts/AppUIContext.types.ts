import type { GitRakeConfig } from '@utils/config.js'
import type { AppTheme } from '@utils/themes/index.js'

export type ViewState = 'branches' | 'branch' | 'confirmation'

export type AppUIContextData = {
  currentView: ViewState
  inputLocked: boolean
  showExitWarning: boolean
  config: GitRakeConfig
  theme: AppTheme
  setCurrentView: (view: ViewState) => void
  setInputLocked: (locked: boolean) => void
  setShowExitWarning: (show: boolean) => void
}
