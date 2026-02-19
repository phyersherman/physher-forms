/**
 * Centralized default values for all block types
 * Single source of truth for styling, sizes, colors, and configuration
 */

// ===========================
// Button Block Defaults
// ===========================

export const BUTTON_SIZE_MAP = {
  small: '12px',
  medium: '16px',
  large: '20px',
} as const

export const BUTTON_PADDING_MAP = {
  small: '8px 16px',
  medium: '12px 24px',
  large: '16px 32px',
} as const

export interface ButtonConfig {
  url?: string
  alignment?: 'left' | 'center' | 'right'
  backgroundColor?: string
  textColor?: string
  size?: 'small' | 'medium' | 'large'
  openInNewTab?: boolean
}

export const DEFAULT_BUTTON_CONFIG: ButtonConfig = {
  url: '',
  alignment: 'left',
  backgroundColor: '#0ea5a4',
  textColor: '#ffffff',
  size: 'medium',
  openInNewTab: true,
}

// ===========================
// Image Block Defaults
// ===========================

export interface ImageConfig {
  altText?: string
}

export const DEFAULT_IMAGE_CONFIG: ImageConfig = {
  altText: '',
}

// ===========================
// Video Block Defaults
// ===========================

export interface VideoConfig {
  title?: string
}

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  title: '',
}

// ===========================
// Quote Block Defaults
// ===========================

export interface QuoteConfig {
  attribution?: string
  textColor?: string
  borderColor?: string
  backgroundColor?: string
}

export const DEFAULT_QUOTE_CONFIG: QuoteConfig = {
  attribution: '',
  textColor: '#333',
  borderColor: '#0ea5a4',
  backgroundColor: '#f9fffe',
}

// ===========================
// Quiz Block Defaults
// ===========================

export interface QuizQuestion {
  id: string
  text: string
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  options?: string[]
  correctAnswer?: string | string[]
  points?: number
}

export interface QuizConfig {
  title?: string
  description?: string
  passingScore?: number
  attemptsAllowed?: number
  requiresPassToContinue?: boolean
  timeLimitMinutes?: number
  questions?: QuizQuestion[]
}

export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  title: '',
  description: '',
  passingScore: 70,
  attemptsAllowed: 1,
  requiresPassToContinue: false,
  timeLimitMinutes: undefined,
  questions: [],
}

// ===========================
// Form Component Defaults
// ===========================

export const FORM_INPUT_DEFAULTS = {
  padding: '8px 12px',
  borderRadius: '4px',
  borderColor: '#ddd',
  fontSize: '14px',
} as const

// ===========================
// Block Editor Defaults
// ===========================

export const BLOCK_EDITOR_DEFAULTS = {
  defaultBlockType: 'text',
  blockSpacing: '12px',
  blockBorderRadius: '4px',
  blockShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
} as const

// ===========================
// Color Palette (Theme Colors)
// ===========================

export const THEME_COLORS = {
  primary: '#0ea5a4',
  secondary: '#64748b',
  success: '#4caf50',
  danger: '#ff6b6b',
  warning: '#fbbf24',
  info: '#3b82f6',
  light: '#f0f0f0',
  dark: '#333333',
  white: '#ffffff',
  border: '#e0e0e0',
} as const
