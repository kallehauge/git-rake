export type SelectionState = {
  selectedBranchNames: Set<string>
  selectedIndex: number
}

export type SelectionActions = {
  setSelectedIndex: (index: number) => void
  setSelectedBranchNames: (names: Set<string>) => void
}

export type SelectionContextData = SelectionState & SelectionActions
