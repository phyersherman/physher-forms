import React, { useState } from 'react'
import { IBlock } from './BlockEditor'
import styles from './BlockToolbar.module.css'

interface BlockToolbarProps {
  onAddBlock: (type: IBlock['type']) => void
}

const BLOCK_TYPES: { type: IBlock['type']; label: string; icon: string }[] = [
  { type: 'text', label: 'Text', icon: '📝' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'video', label: 'Video', icon: '🎥' },
  { type: 'quiz', label: 'Quiz', icon: '❓' },
  { type: 'quote', label: 'Quote', icon: '💬' },
  { type: 'button', label: 'Button', icon: '🔘' },
]

const BlockToolbar: React.FC<BlockToolbarProps> = ({ onAddBlock }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={styles.toolbar}>
      <button
        className={styles.addButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        + Add Block
      </button>

      {isOpen && (
        <div className={styles.menu}>
          <div className={styles.menuHeader}>
            <p>Choose a block type</p>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className={styles.blockGrid}>
            {BLOCK_TYPES.map((blockType) => (
              <button
                key={blockType.type}
                className={styles.blockOption}
                onClick={() => {
                  onAddBlock(blockType.type)
                  setIsOpen(false)
                }}
              >
                <span className={styles.icon}>{blockType.icon}</span>
                <span className={styles.label}>{blockType.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BlockToolbar
