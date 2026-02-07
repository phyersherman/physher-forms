import React from 'react'
import { IBlock } from '../types'

interface ButtonConfig {
  url?: string
  alignment?: 'left' | 'center' | 'right'
  backgroundColor?: string
  textColor?: string
  size?: 'small' | 'medium' | 'large'
  openInNewTab?: boolean
}

const ButtonBlockDisplay: React.FC<{ block: IBlock }> = ({ block }) => {
  const config: ButtonConfig = block.config ? JSON.parse(block.config) : {}

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

  return (
    <div
      style={{
        textAlign: (config.alignment || 'left') as any,
        marginBottom: '24px',
      }}
    >
      <a
        href={config.url || '#'}
        target={config.openInNewTab ? '_blank' : '_self'}
        rel={config.openInNewTab ? 'noopener noreferrer' : undefined}
        style={{
          display: 'inline-block',
          backgroundColor: config.backgroundColor || '#0ea5a4',
          color: config.textColor || '#ffffff',
          padding: paddingMap[config.size || 'medium'],
          fontSize: sizeMap[config.size || 'medium'],
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '600',
          textDecoration: 'none',
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLAnchorElement).style.opacity = '0.9'
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLAnchorElement).style.opacity = '1'
        }}
      >
        {block.content || 'Button'}
      </a>
    </div>
  )
}

export default ButtonBlockDisplay
