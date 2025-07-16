import React from 'react'
import { Text } from 'ink'
import { useTheme } from '@contexts/ThemeProvider.js'

interface TrackingStatusProps {
  loading: boolean
  data: { aheadBy: number; behindBy: number } | null | 'not-applicable'
}

export const TrackingStatus = React.memo(function TrackingStatus({
  loading,
  data,
}: TrackingStatusProps) {
  const { theme } = useTheme()

  if (loading) {
    return <Text color={theme.colors.secondary}>fetching...</Text>
  }

  if (data === 'not-applicable') {
    return <Text color={theme.colors.secondary}>not applicable</Text>
  }

  if (!data) {
    return <Text color={theme.colors.secondary}>calculating...</Text>
  }

  const { aheadBy, behindBy } = data

  if (aheadBy === 0 && behindBy === 0) {
    return <Text color={theme.colors.success}>up to date</Text>
  }

  return (
    <>
      {aheadBy > 0 && (
        <Text color={theme.colors.success}>+{aheadBy} ahead</Text>
      )}
      {aheadBy > 0 && behindBy > 0 && <Text>, </Text>}
      {behindBy > 0 && (
        <Text color={theme.colors.warning}>-{behindBy} behind</Text>
      )}
    </>
  )
})
