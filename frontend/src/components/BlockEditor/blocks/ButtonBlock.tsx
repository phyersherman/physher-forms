import React, { useState, useEffect } from 'react'
import { IBlock, BlockProps } from '../types'
import styles from './blocks.module.css'

interface ButtonConfig {
  url?: string
  alignment?: 'left' | 'center' | 'right'
  backgroundColor?: string
  textColor?: string
  size?: 'small' | 'medium' | 'large'
  openInNewTab?: boolean
}

const ButtonBlock: React.FC<BlockProps> = ({
  block,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [buttonText, setButtonText] = useState(block.content || '')
  const [config, setConfig] = useState<ButtonConfig>({
    url: '',
    alignment: 'left',
    backgroundColor: '#0ea5a4',
    textColor: '#ffffff',
    size: 'medium',
    openInNewTab: true,
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
    setButtonText(block.content || '')
  }, [block.content])

  const handleBlur = () => {
    if (buttonText !== block.content) {
      onUpdate({ content: buttonText })
    }

    const configJson = JSON.stringify(config)
    if (configJson !== block.config) {
      onUpdate({ config: configJson })
    }
  }

  const sizeMap = {
    small: '12px',
    medium: '16px',
    large: '20px',
  }

  const paddingMap = {
    small: '8px 16px',
    medium: '12px 24px',
    large: '16px 32px',
  }

  const preview = buttonText || '(button)'

  return (
    <div className={styles.block}>
      <div className={styles.blockHeader} onClick={onToggleExpand}>
        <div className={styles.blockInfo}>
          <span className={styles.blockType}>🔘 Button</span>
          <span className={styles.blockPreview}>{preview}</span>
        </div>
        <button className={styles.expandButton}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.blockContent}>
          <div className={styles.formGroup}>
            <label>Button Text</label>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              onBlur={handleBlur}
              placeholder="Click me"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Button URL</label>
            <input
              type="text"
              value={config.url || ''}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              onBlur={handleBlur}
              placeholder="https://example.com"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Size</label>
            <select
              value={config.size || 'medium'}
              onChange={(e) =>
                setConfig({
                  ...config,
                  size: e.target.value as 'small' | 'medium' | 'large',
                })
              }
              onBlur={handleBlur}
              className={styles.input}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Alignment</label>
            <select
              value={config.alignment || 'left'}
              onChange={(e) =>
                setConfig({
                  ...config,
                  alignment: e.target.value as 'left' | 'center' | 'right',
                })
              }
              onBlur={handleBlur}
              className={styles.input}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Button Color</label>
            <input
              type="color"
              value={config.backgroundColor || '#0ea5a4'}
              onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
              onBlur={handleBlur}
              className={styles.colorInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Text Color</label>
            <input
              type="color"
              value={config.textColor || '#ffffff'}
              onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
              onBlur={handleBlur}
              className={styles.colorInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={config.openInNewTab ?? true}
                onChange={(e) => setConfig({ ...config, openInNewTab: e.target.checked })}
                onBlur={handleBlur}
              />
              {' '}Open in new tab
            </label>
          </div>

          <button
            className={styles.deleteButton}
            onClick={onDelete}
          >
            Delete Block
          </button>
        </div>
      )}

      {!isExpanded && buttonText && (
        <div
          className={styles.buttonPreview}
          style={{ textAlign: config.alignment || 'left', padding: '16px 0' }}
        >
          <button
            style={{
              backgroundColor: config.backgroundColor || '#0ea5a4',
              color: config.textColor || '#ffffff',
              padding: paddingMap[config.size || 'medium'],
              fontSize: sizeMap[config.size || 'medium'],
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = '1'
            }}
          >
            {buttonText}
          </button>
        </div>
      )}
    </div>
  )
}

export default ButtonBlock
