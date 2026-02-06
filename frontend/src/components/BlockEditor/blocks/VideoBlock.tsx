import React, { useState, useEffect } from 'react'
import { IBlock, BlockProps } from '../types'
import styles from './blocks.module.css'

const VideoBlock: React.FC<BlockProps> = ({
  block,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [videoUrl, setVideoUrl] = useState(block.content || '')
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

  useEffect(() => {
    setVideoUrl(block.content || '')
  }, [block.content])

  const handleBlur = () => {
    if (videoUrl !== block.content) {
      onUpdate({ content: videoUrl })
    }

    const config = JSON.stringify({ title })
    if (config !== block.config) {
      onUpdate({ config })
    }
  }

  const isYoutubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
  const youtubeEmbedUrl = isYoutubeUrl
    ? videoUrl.replace(/watch\?v=/, 'embed/').replace(/youtu\.be\//, 'youtube.com/embed/')
    : null

  return (
    <div className={styles.block}>
      <div className={styles.blockHeader} onClick={onToggleExpand}>
        <div className={styles.blockInfo}>
          <span className={styles.blockType}>🎥 Video</span>
          <span className={styles.blockPreview}>
            {videoUrl ? 'Video added' : '(no video)'}
          </span>
        </div>
        <button className={styles.expandButton}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.blockContent}>
          <div className={styles.formGroup}>
            <label>Video URL</label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onBlur={handleBlur}
              placeholder="https://youtube.com/watch?v=... or video file URL"
              className={styles.input}
            />
            <small>Supports YouTube URLs or direct video file URLs</small>
          </div>
          <div className={styles.formGroup}>
            <label>Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlur}
              placeholder="Video title"
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

      {!isExpanded && videoUrl && (
        <div className={styles.preview}>
          {isYoutubeUrl && youtubeEmbedUrl ? (
            <iframe
              width="100%"
              height="360"
              src={youtubeEmbedUrl}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: '6px' }}
            />
          ) : (
            <video width="100%" height="360" controls style={{ borderRadius: '6px' }}>
              <source src={videoUrl} />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}
    </div>
  )
}

export default VideoBlock
