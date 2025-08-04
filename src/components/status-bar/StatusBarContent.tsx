import { Text } from 'ink'

export type StatusBarItem = {
  label: string
  value: string
}

export type StatusBarContentProps = {
  items: StatusBarItem[]
  separator?: string
  labelColor: string
  valueColor: string
}

export function StatusBarContent({
  items,
  separator = ' • ',
  labelColor,
  valueColor,
}: StatusBarContentProps) {
  return (
    <>
      {items.map((item, index) => (
        <Text key={index}>
          {index > 0 && <Text color={labelColor}>{separator}</Text>}
          <Text color={labelColor}>
            {item.label} <Text color={valueColor}>{item.value}</Text>
          </Text>
        </Text>
      ))}
    </>
  )
}
