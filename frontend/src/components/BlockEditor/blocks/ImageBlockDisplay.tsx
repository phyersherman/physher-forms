import React, { useState, useEffect } from 'react'
import { IBlock } from '../types'

interface ImageBlockDisplayProps {
  block: IBlock
}

const ImageBlockDisplay: React.FC<ImageBlockDisplayProps> = ({ block }) => {
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

  return (
    <div style={{ marginBottom: '24px', textAlign: 'center' }}>
      {block.content ? (
        <img
          src={block.content}
          alt={altText}
          style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
      ) : (
        <div
          style={{
            padding: '60px 20px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            color: '#999',
            fontStyle: 'italic',
          }}
        >
          No image
        </div>
      )}
      {altText && (
        <p style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
          {altText}
        </p>
      )}
    </div>
  )
}

export default ImageBlockDisplay
