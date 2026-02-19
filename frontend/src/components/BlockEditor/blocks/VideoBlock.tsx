import React from 'react'
import { BlockProps } from '../types'
import { useBlockContent } from '../hooks/useBlockContent'
import { useBlockConfig } from '../hooks/useBlockConfig'
import { FormInput } from './FormComponents'
import { BlockWrapper } from './BlockWrapper'
import { VideoConfig, DEFAULT_VIDEO_CONFIG } from '../../../constants/block-defaults'

// Alias for consistency with rest of code
const DEFAULT_CONFIG = DEFAULT_VIDEO_CONFIG

const VideoBlock: React.FC<BlockProps> = ({
  block,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [videoUrl, updateVideoUrl, saveVideoUrl] = useBlockContent(
    block.content,
    block.id,
    onUpdate
  )
  const [config, updateConfig] = useBlockConfig<VideoConfig>(
    block.config,
    DEFAULT_CONFIG,
    block.id,
    onUpdate
  )

  const handleVideoUrlBlur = () => {
    if (videoUrl !== block.content) {
      saveVideoUrl()
    }
  }

  const isYoutubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
  const youtubeEmbedUrl = isYoutubeUrl
    ? videoUrl.replace(/watch\?v=/, 'embed/').replace(/youtu\.be\//, 'youtube.com/embed/')
    : null

  const preview = videoUrl ? 'Video added' : '(no video)'
  const collapsedPreview = youtubeEmbedUrl && (
    <div style={{ marginTop: 8, aspectRatio: '16 / 9' }}>
      <iframe
        src={youtubeEmbedUrl}
        style={{ width: '100%', height: '100%', borderRadius: 4 }}
        allowFullScreen
      />
    </div>
  )

  return (
    <BlockWrapper
      icon="🎥"
      type="Video"
      preview={preview}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      onDelete={onDelete}
      collapsedPreview={collapsedPreview}
    >
      <FormInput
        label="Video URL"
        type="text"
        value={videoUrl}
        onChange={(e) => updateVideoUrl(e.target.value)}
        onBlur={handleVideoUrlBlur}
        placeholder="https://youtube.com/watch?v=... or video file URL"
      />
      <small style={{ display: 'block', marginBottom: 16, color: '#666' }}>
        Supports YouTube URLs or direct video file URLs
      </small>
      <FormInput
        label="Title (Optional)"
        type="text"
        value={config.title || ''}
        onChange={(e) => updateConfig({ title: e.target.value })}
        placeholder="Optional video title"
      />
    </BlockWrapper>
  )
}

export default VideoBlock
