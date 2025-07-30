import { useMemo } from 'react'
import { useScreenSize } from 'fullscreen-ink'
import type { BoxProps } from 'ink'

type BoxLayoutProps = Pick<
  BoxProps,
  'width' | 'flexGrow' | 'flexShrink' | 'minWidth' | 'overflow' | 'marginRight'
>
type ColumnName =
  | 'selection'
  | 'branchName'
  | 'status'
  | 'updated'
  | 'upstream'
  | 'lastCommit'
type ColumnConfig = {
  visible: boolean
  styles: BoxLayoutProps
}

export type BranchesListLayout = Record<ColumnName, ColumnConfig>

const BREAKPOINTS = {
  STATUS: 55,
  UPDATED: 65,
  UPSTREAM: 76,
  LAST_COMMIT: 90,
} as const

const DEFAULT_COLUMN_STYLES: BoxLayoutProps = {
  flexGrow: 0,
  flexShrink: 0,
  minWidth: 0,
  overflow: 'hidden',
  marginRight: 1,
  width: 10,
}

export function useBranchesListLayout(): BranchesListLayout {
  const { width } = useScreenSize()

  return useMemo(() => {
    return {
      selection: {
        visible: true,
        styles: {
          ...DEFAULT_COLUMN_STYLES,
          width: 3,
        },
      },
      branchName: {
        visible: true,
        styles: {
          ...DEFAULT_COLUMN_STYLES,
          width: 40,
        },
      },
      status: {
        visible: width >= BREAKPOINTS.STATUS,
        styles: {
          ...DEFAULT_COLUMN_STYLES,
        },
      },
      updated: {
        visible: width >= BREAKPOINTS.UPDATED,
        styles: {
          ...DEFAULT_COLUMN_STYLES,
        },
      },
      upstream: {
        visible: width >= BREAKPOINTS.UPSTREAM,
        styles: {
          ...DEFAULT_COLUMN_STYLES,
        },
      },
      lastCommit: {
        visible: width >= BREAKPOINTS.LAST_COMMIT,
        styles: {
          ...DEFAULT_COLUMN_STYLES,
          width: 0,
          flexGrow: 1,
          flexShrink: 1,
          marginRight: 0,
        },
      },
    }
  }, [width])
}
