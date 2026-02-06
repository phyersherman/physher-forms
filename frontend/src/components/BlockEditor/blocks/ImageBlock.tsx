import React, { useState, useEffect } from 'react'
import { IBlock, BlockProps } from '../types'
import styles from './blocks.module.css'

const ImageBlock: React.FC<BlockProps> = ({
  block,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [imageUrl, setImageUrl] = useState(block.content || '')
  const [altText, setAltText] = useState('')

  useEffect(() => {
    if (block.config) {
      try {
        const config = JSON.parse(block.config)
        setAltText(config.altText || '')
      } catch {
        // ignore
      }
    }
  }, [block.config])

  useEffect(() => {
    setImageUrl(block.content || '')
  }, [block.content])

  const handleBlur = () => {
    if (imageUrl !== block.content) {
      onUpdate({ content: imageUrl })
    }

    const config = JSON.stringify({ altText })
    if (config !== block.config) {
      onUpdate({ config })
    }
  }

  return (
    <div className={styles.block}>
      <div className={styles.blockHeader} onClick={onToggleExpand}>
        <div className={styles.blockInfo}>
          <span className={styles.blockType}>🖼️ Image</span>
          <span className={styles.blockPreview}>
            {imageUrl ? 'Image loaded' : '(no image)'}
          </span>
        </div>
        <button className={styles.expandButton}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.blockContent}>
          <div className={styles.formGroup}>
            <label>Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onBlur={handleBlur}
              placeholder="https://example.com/image.jpg"
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Alt Text</label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onBlur={handleBlur}
              placeholder="Describe the image"
              className={styles.input}
            />
          </div>
          <button
            className={styles.deleteButton}
            onClick={onDelete}
          >
            Delete Block
          </button>
        </div>
      )}

      {!isExpanded && imageUrl && (
        <div className={styles.preview}>
          <img src={imageUrl} alt={altText} style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
      )}
    </div>
  )
}

export default ImageBlock
