import React from 'react'
import { IBlock } from '../types'

interface QuoteConfig {
  attribution?: string
  textColor?: string
  borderColor?: string
  backgroundColor?: string
}

const QuoteBlockDisplay: React.FC<{ block: IBlock }> = ({ block }) => {
  const config: QuoteConfig = block.config ? JSON.parse(block.config) : {}

  return (
    <div
      style={{
        borderLeft: `4px solid ${config.borderColor || '#0ea5a4'}`,
        backgroundColor: config.backgroundColor || '#f9fffe',
        color: config.textColor || '#333',
        padding: '24px',
        marginBottom: '24px',
        borderRadius: '4px',
        fontStyle: 'italic',
        lineHeight: '1.8',
      }}
    >
      <p style={{ fontSize: '18px', margin: '0 0 16px 0' }}>
        {block.content || 'No quote provided'}
      </p>
      {config.attribution && (
        <p
          style={{
            fontSize: '14px',
            margin: 0,
            opacity: 0.8,
            textAlign: 'right',
            fontStyle: 'normal',
          }}
        >
          — {config.attribution}
        </p>
      )}
    </div>
  )
}

export default QuoteBlockDisplay
