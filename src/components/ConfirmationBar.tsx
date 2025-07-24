import { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import { useAppUIContext } from '@contexts/AppUIContext.js'

export type ConfirmationType = 'info' | 'warning' | 'alert'

export const CONFIRMATION_SHORTCUTS = {
  navigate: '←→',
  confirm: 'Enter/Y',
  cancel: 'ESC/N',
}

type ConfirmationBarProps = {
  type: ConfirmationType
  children?: React.ReactNode
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
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

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow) {
      setSelectedButton(selectedButton === 'confirm' ? 'cancel' : 'confirm')
    }

    if (key.return || input === 'y' || input === 'Y') {
      onConfirm()
    }

    if (key.escape || input === 'n' || input === 'N') {
      onCancel()
    }
  })

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
            selectedButton === 'confirm'
              ? theme.colors.success
              : theme.colors.border
          }
          paddingX={1}
          marginRight={2}
        >
          <Text
            color={
              selectedButton === 'confirm'
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
            selectedButton === 'cancel'
              ? colorMap['alert']
              : theme.colors.border
          }
          paddingX={1}
        >
          <Text
            color={
              selectedButton === 'cancel'
                ? colorMap['alert']
                : theme.colors.text
            }
          >
            {cancelText}
          </Text>
        </Box>
      </Box>

      {children && <Box>{children}</Box>}
    </Box>
  )
}
