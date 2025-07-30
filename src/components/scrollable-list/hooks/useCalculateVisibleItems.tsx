export function useCalculateVisibleItems<T>(
  items: T[],
  containerLines: number,
  selectedIndex: number,
  indicatorHeight: number,
  centerSelected: boolean = false,
): {
  visibleItems: T[]
  visibleCount: number
  scrollOffset: number
  needsScrolling: boolean
} {
  // Check if scrolling is needed by accounting for indicator height
  const availableItemLines = containerLines - indicatorHeight
  const needsScrolling = items.length > availableItemLines

  if (!needsScrolling) {
    return {
      visibleItems: items,
      visibleCount: items.length,
      scrollOffset: 0,
      needsScrolling: false,
    }
  }

  // Calculate the amount of lines we have available when taking the scrolling
  // indicator into account. We already calculated this above.
  const visibleCount = Math.max(1, availableItemLines)

  // Calculate the scroll offset based on the number of lines we have to work with
  // and the number of items we have. Center the selected item if requested.
  const baseOffset = centerSelected
    ? selectedIndex - Math.floor(visibleCount / 2)
    : selectedIndex

  const scrollOffset = Math.max(
    0,
    Math.min(baseOffset, items.length - visibleCount),
  )
  const visibleItems = items.slice(scrollOffset, scrollOffset + visibleCount)

  return {
    visibleItems,
    visibleCount,
    scrollOffset,
    needsScrolling,
  }
}
