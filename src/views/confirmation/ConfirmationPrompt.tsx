import { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { GitBranch } from '@services/GitRepository.js'
import { useTheme } from '@contexts/ThemeProvider.js'
import { useAppUIContext } from '@contexts/AppProviders.js'

interface ConfirmationPromptProps {
  branches: GitBranch[]
  operation: 'delete' | 'restore'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationPrompt({
  branches,
  operation,
  onConfirm,
  onCancel,
}: ConfirmationPromptProps) {
  const { theme } = useTheme()
  const { setCurrentView, inputLocked } = useAppUIContext()
  const [selectedOption, setSelectedOption] = useState<'confirm' | 'cancel'>(
    'cancel',
  )

  useInput(
    (input, key) => {
      if (key.leftArrow || key.rightArrow) {
        setSelectedOption(selectedOption === 'confirm' ? 'cancel' : 'confirm')
      }

      if (key.return) {
        if (selectedOption === 'confirm') {
          onConfirm()
        } else {
          onCancel()
        }
      }

      if (key.escape) {
        setCurrentView('branches')
      }

      if (input === 'y' || input === 'Y') {
        onConfirm()
      }

      if (input === 'n' || input === 'N') {
        onCancel()
      }
    },
    { isActive: !inputLocked },
  )

  const warningColor =
    operation === 'delete' ? theme.colors.error : theme.colors.warning

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={warningColor}
      padding={1}
    >
      <Text color={warningColor} bold>
        Confirm {operation} {branches.length} branch
        {branches.length > 1 ? 'es' : ''}:
      </Text>

      <Box flexDirection="column" height={10} overflow="hidden">
        {branches.map((branch, index) => (
          <Text key={branch.name} color={theme.colors.text}>
            {index + 1}. {branch.name}
            {branch.isMerged && (
              <Text color={theme.colors.success}> (merged)</Text>
            )}
            {branch.isStale && (
              <Text color={theme.colors.warning}> (stale)</Text>
            )}
          </Text>
        ))}
        {branches.length > 10 && (
          <Text color={theme.colors.secondary}>
            ... and {branches.length - 10} more
          </Text>
        )}
      </Box>

      {operation === 'delete' && (
        <Text color={theme.colors.warning}>
          Note: Branches will be moved to trash and can be restored later.
        </Text>
      )}

      <Box marginTop={1}>
        <Box
          borderStyle="single"
          borderColor={
            selectedOption === 'confirm'
              ? theme.colors.success
              : theme.colors.border
          }
          paddingX={1}
          marginRight={2}
        >
          <Text
            color={
              selectedOption === 'confirm'
                ? theme.colors.success
                : theme.colors.text
            }
          >
            Confirm (Y)
          </Text>
        </Box>

        <Box
          borderStyle="single"
          borderColor={
            selectedOption === 'cancel'
              ? theme.colors.error
              : theme.colors.border
          }
          paddingX={1}
        >
          <Text
            color={
              selectedOption === 'cancel'
                ? theme.colors.error
                : theme.colors.text
            }
          >
            Cancel (N)
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
