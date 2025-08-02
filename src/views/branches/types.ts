import type { BoxProps } from 'ink'
import { BRANCH_OPERATIONS } from './constants.js'

export type UIOperationType =
  (typeof BRANCH_OPERATIONS)[keyof typeof BRANCH_OPERATIONS]

export type BoxLayoutProps = Pick<
  BoxProps,
  'width' | 'flexGrow' | 'flexShrink' | 'minWidth' | 'overflow' | 'marginRight'
>

export type ColumnName =
  | 'selection'
  | 'branchName'
  | 'status'
  | 'updated'
  | 'upstream'
  | 'lastCommit'

export type ColumnConfig = {
  visible: boolean
  styles: BoxLayoutProps
}

export type BranchesListLayout = Record<ColumnName, ColumnConfig>
