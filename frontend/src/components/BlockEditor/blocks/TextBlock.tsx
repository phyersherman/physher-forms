'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { IBlock, BlockProps } from '../types'
import styles from './blocks.module.css'
import { MenuBar } from './MenuBar'

const TextBlock: React.FC<BlockProps> = ({
  block,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [isMounted, setIsMounted] = useState(false)
  const lastSavedContent = useRef(block.content || '')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'paragraph',
          },
        },
        heading: {
          HTMLAttributes: {
            class: 'heading',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'ordered-list',
          },
        },
      }),
    ],
    content: block.content || '',
    onBlur: ({ editor }) => {
      const content = editor.getHTML()
      if (content !== lastSavedContent.current) {
        lastSavedContent.current = content
        onUpdate({ content })
      }
    },
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Only update editor if block content changed externally (from parent)
  useEffect(() => {
    if (!editor) return
    
    const editorContent = editor.getHTML()
    const blockContent = block.content || ''
    
    // Only update if content changed externally (not from user typing)
    if (blockContent !== editorContent && blockContent !== lastSavedContent.current) {
      editor.commands.setContent(blockContent)
      lastSavedContent.current = blockContent
    }
  }, [block.id]) // Only depend on block ID, not content changes

  const preview = editor
    ?.getHTML()
    .substring(0, 100)
    .replace(/<[^>]*>/g, '') || ''

  if (!editor) {
    return null
  }

  return (
    <div className={styles.block}>
      <div className={styles.blockHeader} onClick={onToggleExpand}>
        <div className={styles.blockInfo}>
          <span className={styles.blockType}>📝 Text</span>
          <span className={styles.blockPreview}>
            {preview || '(empty)'}
          </span>
        </div>
        <button className={styles.expandButton}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.blockContent}>
          {isMounted && (
            <div className={styles.richTextEditor}>
              <MenuBar editor={editor} />
              <EditorContent editor={editor} className={styles.editorContent} />
            </div>
          )}
          <button
            className={styles.deleteButton}
            onClick={onDelete}
          >
            Delete Block
          </button>
        </div>
      )}

      {!isExpanded && editor.getHTML() && (
        <div
          className={styles.preview}
          dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
        />
      )}
    </div>
  )
}

export default TextBlock
