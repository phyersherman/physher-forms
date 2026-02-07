import React, { useState, useEffect } from 'react'
import { IBlock, BlockProps } from '../types'
import styles from './blocks.module.css'

interface QuoteConfig {
  attribution?: string
  textColor?: string
  borderColor?: string
  backgroundColor?: string
}

const QuoteBlock: React.FC<BlockProps> = ({
  block,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [quoteText, setQuoteText] = useState(block.content || '')
  const [config, setConfig] = useState<QuoteConfig>({
    attribution: '',
    textColor: '#333',
    borderColor: '#0ea5a4',
    backgroundColor: '#f9fffe',
  })

  useEffect(() => {
    if (block.config) {
      try {
        setConfig({
          ...config,
          ...JSON.parse(block.config),
        })
      } catch {
        // ignore
      }
    }
  }, [block.id])

  useEffect(() => {
    setQuoteText(block.content || '')
  }, [block.content])

  const handleBlur = () => {
    if (quoteText !== block.content) {
      onUpdate({ content: quoteText })
    }

    const configJson = JSON.stringify(config)
    if (configJson !== block.config) {
      onUpdate({ config: configJson })
    }
  }

  const preview = quoteText.substring(0, 60) || '(empty)'

  return (
    <div className={styles.block}>
      <div className={styles.blockHeader} onClick={onToggleExpand}>
        <div className={styles.blockInfo}>
          <span className={styles.blockType}>💬 Quote</span>
          <span className={styles.blockPreview}>{preview}</span>
        </div>
        <button className={styles.expandButton}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.blockContent}>
          <div className={styles.formGroup}>
            <label>Quote Text</label>
            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              onBlur={handleBlur}
              placeholder="Enter your quote"
              rows={4}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Attribution (Author)</label>
            <input
              type="text"
              value={config.attribution || ''}
              onChange={(e) => setConfig({ ...config, attribution: e.target.value })}
              onBlur={handleBlur}
              placeholder="e.g., Jane Doe"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Text Color</label>
            <input
              type="color"
              value={config.textColor || '#333'}
              onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
              onBlur={handleBlur}
              className={styles.colorInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Border Color</label>
            <input
              type="color"
              value={config.borderColor || '#0ea5a4'}
              onChange={(e) => setConfig({ ...config, borderColor: e.target.value })}
              onBlur={handleBlur}
              className={styles.colorInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Background Color</label>
            <input
              type="color"
              value={config.backgroundColor || '#f9fffe'}
              onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
              onBlur={handleBlur}
              className={styles.colorInput}
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

      {!isExpanded && quoteText && (
        <div
          className={styles.quotePreview}
          style={{
            borderLeftColor: config.borderColor || '#0ea5a4',
            backgroundColor: config.backgroundColor || '#f9fffe',
            color: config.textColor || '#333',
          }}
        >
          <p className={styles.quoteText}>{quoteText}</p>
          {config.attribution && (
            <p className={styles.quoteAttribution}>— {config.attribution}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default QuoteBlock
