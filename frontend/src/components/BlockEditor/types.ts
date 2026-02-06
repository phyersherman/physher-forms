export interface IBlock {
  id: string
  type: 'text' | 'image' | 'video' | 'quiz' | 'quote' | 'button'
  content?: string
  config?: string
  order_index: number
}

export interface BlockProps {
  block: IBlock
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (updates: Partial<IBlock>) => void
  onDelete: () => void
  previewMode?: boolean
}
