import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import { Spinner } from './Spinner.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { logger } from '@utils/logger.js'

type ConfirmationBarProps = {
  type: 'info' | 'warning' | 'alert'
  children?: React.ReactNode
  confirmText: string
  cancelText: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export const CONFIRMATION_SHORTCUTS = {
  navigate: '←→',
  confirm: 'Enter/Y',
  cancel: 'ESC/N',
}

export function ConfirmationBar({
  type,
  children,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmationBarProps) {
  const { theme, setInputLocked } = useAppUIContext()
  const [selectedButton, setSelectedButton] = useState<'confirm' | 'cancel'>(
    'cancel',
  )
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    setInputLocked(true)
    return () => setInputLocked(false)
  }, [setInputLocked])

  const colorMap = {
    info: theme.colors.primary,
    warning: theme.colors.warning,
    alert: theme.colors.error,
  }

  const themeColor = colorMap[type]

  const handleConfirm = async () => {
    setIsExecuting(true)

    try {
      await onConfirm()
    } catch (error) {
      logger.error('Confirmation operation failed', {
        operation: type,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsExecuting(false)
    }
  }

  useInput(
    (input, key) => {
      if (key.leftArrow || key.rightArrow) {
        setSelectedButton(selectedButton === 'confirm' ? 'cancel' : 'confirm')
      }

      if (key.return || input === 'y' || input === 'Y') {
        handleConfirm()
      }

      if (key.escape || input === 'n' || input === 'N') {
        onCancel()
      }
    },
    { isActive: !isExecuting },
  )

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={themeColor}
      paddingX={1}
      marginTop={1}
    >
      <Box>
        <Box
          borderStyle="single"
          borderColor={
            !isExecuting && selectedButton === 'confirm'
              ? theme.colors.success
              : theme.colors.border
          }
          paddingX={1}
          marginRight={2}
        >
          <Text
            color={
              isExecuting
                ? theme.colors.muted
                : selectedButton === 'confirm'
                  ? theme.colors.success
                  : theme.colors.text
            }
          >
            {confirmText}
          </Text>
        </Box>

        <Box
          borderStyle="single"
          borderColor={
            !isExecuting && selectedButton === 'cancel'
              ? colorMap['alert']
              : theme.colors.border
          }
          paddingX={1}
        >
          <Text
            color={
              isExecuting
                ? theme.colors.muted
                : selectedButton === 'cancel'
                  ? colorMap['alert']
                  : theme.colors.text
            }
          >
            {cancelText}
          </Text>
        </Box>

        {isExecuting && (
          <Box flexDirection="row" alignItems="center" marginLeft={2}>
            <Spinner type="dots" height={0} />
            <Text color={themeColor}>Processing...</Text>
          </Box>
        )}
      </Box>

      {children && <Box>{children}</Box>}
    </Box>
  )
}
