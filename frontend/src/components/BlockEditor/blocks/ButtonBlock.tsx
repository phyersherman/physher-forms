import React from 'react'
import { BlockProps } from '../types'
import styles from './blocks.module.css'
import { useBlockConfig } from '../hooks/useBlockConfig'
import { useBlockContent } from '../hooks/useBlockContent'
import { FormInput, FormSelect, FormColorInput } from './FormComponents'
import { BlockWrapper } from './BlockWrapper'

interface ButtonConfig {
  url?: string
  alignment?: 'left' | 'center' | 'right'
  backgroundColor?: string
  textColor?: string
  size?: 'small' | 'medium' | 'large'
  openInNewTab?: boolean
}

const DEFAULT_BUTTON_CONFIG: ButtonConfig = {
  url: '',
  alignment: 'left',
  backgroundColor: '#0ea5a4',
  textColor: '#ffffff',
  size: 'medium',
  openInNewTab: true,
}

const BUTTON_SIZE_MAP = {
  small: '12px',
  medium: '16px',
  large: '20px',
}

const BUTTON_PADDING_MAP = {
  small: '8px 16px',
  medium: '12px 24px',
  large: '16px 32px',
}

const ButtonBlock: React.FC<BlockProps> = ({
  block,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [buttonText, updateButtonText, saveButtonText] = useBlockContent(
    block.content || '',
    block.id,
    onUpdate
  )

  const [config, updateConfig] = useBlockConfig<ButtonConfig>(
    block.config,
    DEFAULT_BUTTON_CONFIG,
    block.id,
    onUpdate
  )

  const handleConfigChange = (key: keyof ButtonConfig, value: any) => {
    updateConfig({ ...config, [key]: value })
  }

  const preview = buttonText || '(button)'

  const collapsedPreview = buttonText && (
    <div style={{ textAlign: config.alignment || 'left', padding: '16px 0' }}>
      <button
        style={{
          backgroundColor: config.backgroundColor || '#0ea5a4',
          color: config.textColor || '#ffffff',
          padding: BUTTON_PADDING_MAP[config.size || 'medium'],
          fontSize: BUTTON_SIZE_MAP[config.size || 'medium'],
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
  )

  return (
    <BlockWrapper
      icon="🔘"
      type="Button"
      preview={preview}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      onDelete={onDelete}
      collapsedPreview={collapsedPreview}
    >
      <FormInput
        label="Button Text"
        value={buttonText}
        onChange={(e) => updateButtonText(e.target.value)}
        onBlur={saveButtonText}
        placeholder="Click me"
      />

      <FormInput
        label="Button URL"
        value={config.url || ''}
        onChange={(e) => handleConfigChange('url', e.target.value)}
        placeholder="https://example.com"
      />

      <FormSelect
        label="Size"
        value={config.size || 'medium'}
        onChange={(e) => handleConfigChange('size', e.target.value as 'small' | 'medium' | 'large')}
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
      />

      <FormSelect
        label="Alignment"
        value={config.alignment || 'left'}
        onChange={(e) => handleConfigChange('alignment', e.target.value as 'left' | 'center' | 'right')}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ]}
      />

      <FormColorInput
        label="Button Color"
        value={config.backgroundColor || '#0ea5a4'}
        onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
      />

      <FormColorInput
        label="Text Color"
        value={config.textColor || '#ffffff'}
        onChange={(e) => handleConfigChange('textColor', e.target.value)}
      />

      <div className={styles.formGroup}>
        <label>
          <input
            type="checkbox"
            checked={config.openInNewTab ?? true}
            onChange={(e) => handleConfigChange('openInNewTab', e.target.checked)}
          />
          {' '}Open in new tab
        </label>
      </div>
    </BlockWrapper>
  )
}

export default ButtonBlock
