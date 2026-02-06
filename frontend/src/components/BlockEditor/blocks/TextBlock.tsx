import React, { useState, useEffect } from 'react'
import { IBlock, BlockProps } from '../types'
import styles from './blocks.module.css'

const TextBlock: React.FC<BlockProps> = ({
  block,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [content, setContent] = useState(block.content || '')

  useEffect(() => {
    setContent(block.content || '')
  }, [block.content])

  const handleBlur = () => {
    if (content !== block.content) {
      onUpdate({ content })
    }
  }

  const preview = content.substring(0, 100).replace(/<[^>]*>/g, '')

  return (
    <div className={styles.block}>
      <div className={styles.blockHeader} onClick={onToggleExpand}>
        <div className={styles.blockInfo}>
          <span className={styles.blockType}>📝 Text</span>
          <span className={styles.blockPreview}>
            {preview || '(empty)'}
          </span>
        </div>
        <button className={styles.expandButton}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.blockContent}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            placeholder="Enter text content (supports HTML)"
            rows={6}
            className={styles.textarea}
          />
          <button
            className={styles.deleteButton}
            onClick={onDelete}
          >
            Delete Block
          </button>
        </div>
      )}

      {!isExpanded && content && (
        <div
          className={styles.preview}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  )
}

export default TextBlock
