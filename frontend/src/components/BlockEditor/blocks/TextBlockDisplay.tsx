import React from 'react'
import { IBlock } from '../types'

interface TextBlockDisplayProps {
  block: IBlock
}

const TextBlockDisplay: React.FC<TextBlockDisplayProps> = ({ block }) => {
  return (
    <div style={{ marginBottom: '24px', lineHeight: '1.6' }}>
      {block.content ? (
        <div
          dangerouslySetInnerHTML={{ __html: block.content }}
          style={{ fontSize: '16px', color: '#333' }}
        />
      ) : (
        <p style={{ color: '#999', fontStyle: 'italic' }}>No content</p>
      )}
    </div>
  )
}

export default TextBlockDisplay
