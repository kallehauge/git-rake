import { useState } from 'react'
import { Text, useInput } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { type StatusBarType } from './StatusBar.types.js'
import { getStatusBarTypeColor } from './utils.js'

type StatusBarConfirmationProps = {
  type: StatusBarType
  icon: string
  action: string
  selectedCount: number
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function StatusBarConfirmation({
  type,
  icon,
  action,
  selectedCount,
  onConfirm,
  onCancel,
}: StatusBarConfirmationProps) {
  const { theme } = useAppUIContext()
  const [isExecuting, setIsExecuting] = useState(false)

  const handleConfirm = async () => {
    setIsExecuting(true)
    try {
      await onConfirm()
    } finally {
      setIsExecuting(false)
    }
  }

  useInput(
    (input, key) => {
      if (key.return || input === 'y' || input === 'Y') {
        handleConfirm()
      }

      if (key.escape || input === 'n' || input === 'N') {
        onCancel()
      }
    },
    { isActive: !isExecuting },
  )

  const actionColor = getStatusBarTypeColor(type, theme)

  return (
    <Text>
      <Text color={actionColor}>
        {icon} {action}
      </Text>
      <Text color={theme.colors.text}>
        {' '}
        {selectedCount} {selectedCount === 1 ? 'branch' : 'branches'}?{' '}
      </Text>
      <Text color={actionColor}>[Y/n]</Text>
      {isExecuting && <Text> • Processing...</Text>}
    </Text>
  )
}
