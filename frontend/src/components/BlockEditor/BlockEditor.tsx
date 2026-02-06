import React, { useState, useCallback } from 'react'
import styles from './BlockEditor.module.css'
import TextBlock from './blocks/TextBlock'
import ImageBlock from './blocks/ImageBlock'
import VideoBlock from './blocks/VideoBlock'
import QuizBlock from './blocks/QuizBlock'
import TextBlockDisplay from './blocks/TextBlockDisplay'
import ImageBlockDisplay from './blocks/ImageBlockDisplay'
import VideoBlockDisplay from './blocks/VideoBlockDisplay'
import QuizBlockDisplay from './blocks/QuizBlockDisplay'
import BlockToolbar from './BlockToolbar'
import { IBlock } from './types'

// Re-export for backwards compatibility
export type { IBlock } from './types'

interface BlockEditorProps {
  moduleId: string
  blocks: IBlock[]
  onBlocksChange: (blocks: IBlock[]) => void
  onSave?: () => Promise<void>
  isSaving?: boolean
  previewMode?: boolean
  showHeader?: boolean
}

const BlockEditor: React.FC<BlockEditorProps> = ({
  moduleId,
  blocks,
  onBlocksChange,
  onSave,
  isSaving = false,
  previewMode = false,
  showHeader = true,
}) => {
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null)

  const handleAddBlock = useCallback((type: IBlock['type']) => {
    const newBlock: IBlock = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      config: '{}',
      order_index: blocks.length,
    }
    onBlocksChange([...blocks, newBlock])
  }, [blocks, onBlocksChange])

  const handleUpdateBlock = useCallback((blockId: string, updates: Partial<IBlock>) => {
    const updated = blocks.map(b =>
      b.id === blockId ? { ...b, ...updates } : b
    )
    onBlocksChange(updated)
  }, [blocks, onBlocksChange])

  const handleDeleteBlock = useCallback((blockId: string) => {
    const filtered = blocks.filter(b => b.id !== blockId)
    // Reindex order
    const reindexed = filtered.map((b, idx) => ({
      ...b,
      order_index: idx,
    }))
    onBlocksChange(reindexed)
  }, [blocks, onBlocksChange])

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault()
    if (!draggedBlockId || draggedBlockId === targetBlockId) {
      setDraggedBlockId(null)
      return
    }

    const draggedIndex = blocks.findIndex(b => b.id === draggedBlockId)
    const targetIndex = blocks.findIndex(b => b.id === targetBlockId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedBlockId(null)
      return
    }

    const newBlocks = [...blocks]
    const [movedBlock] = newBlocks.splice(draggedIndex, 1)
    newBlocks.splice(targetIndex, 0, movedBlock)

    // Reindex order_index
    const reindexed = newBlocks.map((b, idx) => ({
      ...b,
      order_index: idx,
    }))

    onBlocksChange(reindexed)
    setDraggedBlockId(null)
  }

  const handleDragEnd = () => {
    setDraggedBlockId(null)
  }

  const renderBlock = (block: IBlock) => {
    // In preview mode, show learner-facing display components
    if (previewMode) {
      switch (block.type) {
        case 'text':
          return <TextBlockDisplay key={block.id} block={block} />
        case 'image':
          return <ImageBlockDisplay key={block.id} block={block} />
        case 'video':
          return <VideoBlockDisplay key={block.id} block={block} />
        case 'quiz':
          return <QuizBlockDisplay key={block.id} block={block} />
        default:
          return null
      }
    }

    // In edit mode, show edit components
    const isExpanded = expandedBlockId === block.id
    const commonProps = {
      block,
      isExpanded,
      onToggleExpand: () => setExpandedBlockId(isExpanded ? null : block.id),
      onUpdate: (updates: Partial<IBlock>) => handleUpdateBlock(block.id, updates),
      onDelete: () => handleDeleteBlock(block.id),
    }

    switch (block.type) {
      case 'text':
        return <TextBlock key={block.id} {...commonProps} />
      case 'image':
        return <ImageBlock key={block.id} {...commonProps} />
      case 'video':
        return <VideoBlock key={block.id} {...commonProps} />
      case 'quiz':
        return <QuizBlock key={block.id} {...commonProps} />
      default:
        return null
    }
  }

  return (
    <div className={styles.blockEditor}>
      {!previewMode && showHeader && onSave && (
        <div className={styles.header}>
          <h2>Lesson Editor</h2>
          <button
            onClick={onSave}
            disabled={isSaving}
            className={styles.saveButton}
          >
            {isSaving ? 'Saving...' : 'Save Lesson'}
          </button>
        </div>
      )}

      {!previewMode && (
        <BlockToolbar onAddBlock={handleAddBlock} />
      )}

      <div className={styles.blocksContainer}>
        {blocks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No blocks yet. Add your first block to get started!</p>
          </div>
        ) : (
          <div className={styles.blocksList}>
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`${styles.blockWrapper} ${draggedBlockId === block.id ? styles.dragging : ''}`}
                draggable={!previewMode}
                onDragStart={(e) => handleDragStart(e, block.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, block.id)}
                onDragEnd={handleDragEnd}
              >
                {!previewMode && (
                  <div className={styles.dragHandle}>⋮⋮</div>
                )}
                {renderBlock(block)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BlockEditor
