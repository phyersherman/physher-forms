import React, { useState, useEffect } from 'react'
import { IBlock } from '../types'

interface VideoBlockDisplayProps {
  block: IBlock
}

const VideoBlockDisplay: React.FC<VideoBlockDisplayProps> = ({ block }) => {
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (block.config) {
      try {
        const config = JSON.parse(block.config)
        setTitle(config.title || '')
      } catch {
        // ignore
      }
    }
  }, [block.config])

  const isYoutubeUrl = block.content?.includes('youtube.com') || block.content?.includes('youtu.be')
  const youtubeEmbedUrl = isYoutubeUrl
    ? block.content!
        .replace('youtube.com/watch?v=', 'youtube.com/embed/')
        .replace('youtu.be/', 'youtube.com/embed/')
    : null

  const isVimeoUrl = block.content?.includes('vimeo.com')
  const vimeoEmbedUrl = isVimeoUrl
    ? `https://player.vimeo.com/video/${block.content!.split('/').pop()}`
    : null

  return (
    <div style={{ marginBottom: '24px' }}>
      {title && (
        <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#333' }}>
          {title}
        </h4>
      )}

      {youtubeEmbedUrl && (
        <iframe
          width="100%"
          height="480"
          src={youtubeEmbedUrl}
          title={title || 'YouTube Video'}
          frameBorder="0"
          allowFullScreen
          style={{ borderRadius: '8px' }}
        />
      )}

      {vimeoEmbedUrl && (
        <iframe
          src={vimeoEmbedUrl}
          width="100%"
          height="480"
          frameBorder="0"
          allowFullScreen
          style={{ borderRadius: '8px' }}
        />
      )}

      {!youtubeEmbedUrl && !vimeoEmbedUrl && block.content && (
        <video
          controls
          style={{
            width: '100%',
            maxHeight: '480px',
            borderRadius: '8px',
            backgroundColor: '#000',
          }}
        >
          <source src={block.content} />
          Your browser does not support the video tag.
        </video>
      )}

      {!block.content && (
        <div
          style={{
            padding: '60px 20px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            color: '#999',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          No video
        </div>
      )}
    </div>
  )
}

export default VideoBlockDisplay
