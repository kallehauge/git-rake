import { cloneElement, ReactNode, memo, Fragment } from 'react'
import { Box, Text } from 'ink'
import { useMeasuredBoxComponent } from '@utils/componentMeasurement.js'
import { useAppUIContext } from '@contexts/AppUIContext.js'
import { useCalculateVisibleItems } from './hooks/useCalculateVisibleItems.js'
import { ScrollableListIndicator } from './ScrollableListIndicator.js'

type ScrollableListProps<T> = {
  items: T[]
  renderItem: (item: T, index: number, isSelected: boolean) => ReactNode
  selectedIndex: number
  centerSelected?: boolean
}

/**
 * Scrollable list component
 *
 * The component will first try and render all items inside a max-height
 * flexbox container, and then measure the height of the container to
 * determine how many lines we have to work with, and then wrap the
 * content in a scrollable container when we know the height.
 */
export const ScrollableList = memo(function ScrollableList<T>({
  items,
  renderItem,
  selectedIndex,
  centerSelected = false,
}: ScrollableListProps<T>) {
  const { theme } = useAppUIContext()

  // Create flexbox container that fills available space to get the
  // height of the container.
  const { component: flexContainer, height: containerHeight } =
    useMeasuredBoxComponent(
      <Box flexGrow={1} height="100%" flexDirection="column">
        {items.length === 0 && (
          <Box justifyContent="center" alignItems="center" height={10}>
            <Text color={theme.colors.text}>No items</Text>
          </Box>
        )}
      </Box>,
    )

  // Scroll indicator height is predictable: 1 line text + 1 line marginTop
  // @todo It's a bit hacky to hardcode the height of the component since it can
  //       break down on a new line for very narrow terminals. The best would be
  //       to get the size of the indicator from the component itself, but there
  //       is some circular dependencies that makes this a bit tricky.
  const indicatorHeight = 2

  // Calculate if we need to scroll and how many lines we can display at a time.
  const { visibleItems, scrollOffset, visibleCount, needsScrolling } =
    useCalculateVisibleItems(
      items,
      containerHeight,
      selectedIndex,
      indicatorHeight,
      centerSelected,
    )

  const scrollIndicator = needsScrolling ? (
    <ScrollableListIndicator
      currentIndex={selectedIndex}
      totalItems={items.length}
      hasMoreAbove={scrollOffset > 0}
      hasMoreBelow={scrollOffset + visibleCount < items.length}
    />
  ) : null

  return cloneElement(flexContainer, {
    children: (
      <>
        {visibleItems.map((item, visibleIndex) => {
          const actualIndex = scrollOffset + visibleIndex
          const isSelected = actualIndex === selectedIndex
          return (
            <Fragment key={actualIndex}>
              {renderItem(item, actualIndex, isSelected)}
            </Fragment>
          )
        })}
        {scrollIndicator}
      </>
    ),
  })
}) as <T>(props: ScrollableListProps<T>) => ReactNode
