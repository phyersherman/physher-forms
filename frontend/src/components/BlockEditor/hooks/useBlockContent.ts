import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook for managing block content with save debouncing
 * Handles:
 * - Local state management for content
 * - Change detection before saving
 * - Syncing with parent when block updates externally
 */
export function useBlockContent(
  initialContent: string | undefined,
  blockId: string,
  onUpdate: (data: { content: string }) => void
): [string, (content: string) => void, () => void] {
  const [content, setContent] = useState(initialContent || '')
  const lastSavedContent = useRef(initialContent || '')

  // Sync with parent when block content changes externally
  useEffect(() => {
    setContent(initialContent || '')
    lastSavedContent.current = initialContent || ''
  }, [blockId, initialContent])

  const updateContent = (newContent: string) => {
    setContent(newContent)
  }

  const saveContent = () => {
    if (content !== lastSavedContent.current) {
      lastSavedContent.current = content
      onUpdate({ content })
    }
  }

  return [content, updateContent, saveContent]
}
