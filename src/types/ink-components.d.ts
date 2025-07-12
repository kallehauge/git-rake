declare module 'ink' {
  import { ComponentType, ReactNode } from 'react';

  export interface BoxProps {
    children?: ReactNode;
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    flex?: number;
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    width?: number | string;
    height?: number | string;
    minWidth?: number;
    minHeight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingX?: number;
    paddingY?: number;
    padding?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    marginX?: number;
    marginY?: number;
    margin?: number;
    borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
    borderColor?: string;
    borderTop?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
    overflow?: 'hidden' | 'visible';
    backgroundColor?: string;
  }

  export interface TextProps {
    children?: ReactNode;
    color?: string;
    backgroundColor?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    wrap?: 'wrap' | 'truncate' | 'truncate-start' | 'truncate-middle' | 'truncate-end';
  }

  export const Box: ComponentType<BoxProps>;
  export const Text: ComponentType<TextProps>;

  export interface Key {
    upArrow?: boolean;
    downArrow?: boolean;
    leftArrow?: boolean;
    rightArrow?: boolean;
    pageDown?: boolean;
    pageUp?: boolean;
    return?: boolean;
    escape?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    tab?: boolean;
    backspace?: boolean;
    delete?: boolean;
    meta?: boolean;
  }

  export type InputHandler = (input: string, key: Key) => void;

  export function useInput(inputHandler: InputHandler): void;
  export function useApp(): { exit(exitCode?: number): void };
  export function render(tree: ReactNode): { unmount(): void; waitUntilExit(): Promise<void> };
}