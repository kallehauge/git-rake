import { ReactNode } from 'react'
import { GitBranch } from '@services/GitRepository.js'
import { SearchProvider } from './SearchContext.js'
import { SelectionProvider } from './SelectionContext.js'
import { AppUIProvider } from './AppUIContext.js'
import { BranchDataProvider } from './BranchDataContext.js'

interface AppProvidersProps {
  children: ReactNode
  branches: GitBranch[]
}

export function AppProviders({ children, branches }: AppProvidersProps) {
  return (
    <SearchProvider>
      <SelectionProvider>
        <BranchDataProvider branches={branches}>
          <AppUIProvider>{children}</AppUIProvider>
        </BranchDataProvider>
      </SelectionProvider>
    </SearchProvider>
  )
}

export { useSearchContext } from './SearchContext.js'
export { useSelectionContext } from './SelectionContext.js'
export { useAppUIContext } from './AppUIContext.js'
export { useBranchDataContext } from './BranchDataContext.js'
export { useTheme } from './ThemeProvider.js'
