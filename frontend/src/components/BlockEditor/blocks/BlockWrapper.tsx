import React from 'react'
import styles from './blocks.module.css'

/**
 * Reusable block wrapper component
 * Provides consistent structure for all block types:
 * - Header with icon, type, and preview
 * - Expandable content area
 * - Optional collapsed preview
 * - Delete button
 */

interface BlockWrapperProps {
  icon: string
  type: string
  preview: string
  isExpanded: boolean
  onToggleExpand: () => void
  onDelete: () => void
  children: React.ReactNode
  collapsedPreview?: React.ReactNode
}

export const BlockWrapper: React.FC<BlockWrapperProps> = ({
  icon,
  type,
  preview,
  isExpanded,
  onToggleExpand,
  onDelete,
  children,
  collapsedPreview,
}) => (
  <div className={styles.block}>
    {/* Block Header */}
    <div className={styles.blockHeader} onClick={onToggleExpand}>
      <div className={styles.blockInfo}>
        <span className={styles.blockType}>{icon} {type}</span>
        <span className={styles.blockPreview}>{preview}</span>
      </div>
      <button className={styles.expandButton} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
        {isExpanded ? '▼' : '▶'}
      </button>
    </div>

    {/* Expanded Content */}
    {isExpanded && (
      <div className={styles.blockContent}>
        {children}
        <button className={styles.deleteButton} onClick={onDelete}>
          Delete Block
        </button>
      </div>
    )}

    {/* Collapsed Preview */}
    {!isExpanded && collapsedPreview}
  </div>
)
