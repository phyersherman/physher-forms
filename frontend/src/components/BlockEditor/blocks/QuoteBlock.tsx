import React from 'react'
import { IBlock, BlockProps } from '../types'
import { useBlockContent } from '../hooks/useBlockContent'
import { useBlockConfig } from '../hooks/useBlockConfig'
import { FormTextarea, FormInput, FormColorInput } from './FormComponents'
import { BlockWrapper } from './BlockWrapper'
import styles from './blocks.module.css'

interface QuoteConfig {
  attribution?: string
  textColor?: string
  borderColor?: string
  backgroundColor?: string
}

const DEFAULT_CONFIG: QuoteConfig = {
  attribution: '',
  textColor: '#333',
  borderColor: '#0ea5a4',
  backgroundColor: '#f9fffe',
}

const QuoteBlock: React.FC<BlockProps> = ({
  block,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [quoteText, updateQuoteText, saveQuoteText] = useBlockContent(
    block.content,
    block.id,
    onUpdate
  )
  const [config, updateConfig] = useBlockConfig(
    block.config,
    DEFAULT_CONFIG,
    block.id,
    onUpdate
  )

  const handleQuoteTextBlur = () => {
    if (quoteText !== block.content) {
      saveQuoteText()
    }
  }

  const preview = quoteText.substring(0, 60) || '(empty)'
  const collapsedPreview = quoteText && (
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
  )

  return (
    <BlockWrapper
      icon="💬"
      type="Quote"
      preview={preview}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      onDelete={onDelete}
      collapsedPreview={collapsedPreview}
    >
      <FormTextarea
        label="Quote Text"
        value={quoteText}
        onChange={(e) => updateQuoteText(e.target.value)}
        onBlur={handleQuoteTextBlur}
        placeholder="Enter your quote"
        rows={4}
      />
      <FormInput
        label="Attribution (Author)"
        type="text"
        value={config.attribution || ''}
        onChange={(e) => updateConfig({ attribution: e.target.value })}
        placeholder="e.g., Jane Doe"
      />
      <FormColorInput
        label="Text Color"
        value={config.textColor || '#333'}
        onChange={(e) => updateConfig({ textColor: e.target.value })}
      />
      <FormColorInput
        label="Border Color"
        value={config.borderColor || '#0ea5a4'}
        onChange={(e) => updateConfig({ borderColor: e.target.value })}
      />
      <FormColorInput
        label="Background Color"
        value={config.backgroundColor || '#f9fffe'}
        onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
      />
    </BlockWrapper>
  )
}

export default QuoteBlock
