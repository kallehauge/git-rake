import React, { ReactElement, useRef, useEffect, useState } from 'react'
import { measureElement } from 'ink'
import { useScreenSize } from 'fullscreen-ink'
import type { DOMElement } from 'ink'

/**
 * Measures a component's height using flexbox layout and returns both the component with ref attached and its height.
 * Automatically re-measures when terminal is resized.
 * The component must be rendered with the returned ref-attached version for measurement to work.
 */
export function useMeasuredBoxComponent(boxComponent: ReactElement): {
  component: ReactElement
  height: number
} {
  const ref = useRef<DOMElement>(null)
  const [height, setHeight] = useState(0)
  const { height: screenHeight, width: screenWidth } = useScreenSize()

  useEffect(() => {
    if (ref.current) {
      const { height: measuredHeight } = measureElement(ref.current)
      setHeight(measuredHeight)
    }
  }, [screenHeight, screenWidth])

  const component = React.cloneElement(boxComponent, { ref })

  return { component, height }
}
