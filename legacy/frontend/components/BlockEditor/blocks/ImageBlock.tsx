import React from 'react'
import { BlockProps } from '../types'
import { useBlockContent } from '../hooks/useBlockContent'
import { useBlockConfig } from '../hooks/useBlockConfig'
import { FormInput } from './FormComponents'
import { BlockWrapper } from './BlockWrapper'
import { ImageConfig, DEFAULT_IMAGE_CONFIG } from '../../../constants/block-defaults'

// Alias for consistency with rest of code
const DEFAULT_CONFIG = DEFAULT_IMAGE_CONFIG

const ImageBlock: React.FC<BlockProps> = ({
  block,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [imageUrl, updateImageUrl, saveImageUrl] = useBlockContent(
    block.content,
    block.id,
    onUpdate
  )
  const [config, updateConfig] = useBlockConfig<ImageConfig>(
    block.config,
    DEFAULT_CONFIG,
    block.id,
    onUpdate
  )

  const handleImageUrlBlur = () => {
    if (imageUrl !== block.content) {
      saveImageUrl()
    }
  }

  const preview = imageUrl ? 'Image loaded' : '(no image)'
  const collapsedPreview = imageUrl ? (
    <div style={{ marginTop: 8 }}>
      <img src={imageUrl} alt={config.altText || ''} style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }} />
    </div>
  ) : null

  return (
    <BlockWrapper
      icon="🖼️"
      type="Image"
      preview={preview}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      onDelete={onDelete}
      collapsedPreview={collapsedPreview}
    >
      <FormInput
        label="Image URL"
        type="text"
        value={imageUrl}
        onChange={(e) => updateImageUrl(e.target.value)}
        onBlur={handleImageUrlBlur}
        placeholder="https://example.com/image.jpg"
      />
      <FormInput
        label="Alt Text"
        type="text"
        value={config.altText || ''}
        onChange={(e) => updateConfig({ altText: e.target.value })}
        placeholder="Describe the image"
      />
    </BlockWrapper>
  )
}

export default ImageBlock
