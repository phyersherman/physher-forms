import React from 'react'
import { Editor } from '@tiptap/react'
import styles from './block-toolbar.module.css'

interface MenuBarProps {
  editor: Editor | null
}

export const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) {
    return null
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarGroup}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? styles.active : ''}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? styles.active : ''}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? styles.active : ''}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
      </div>

      <div className={styles.toolbarGroup}>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? styles.active : ''}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? styles.active : ''}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive('paragraph') ? styles.active : ''}
          title="Paragraph"
        >
          ¶
        </button>
      </div>

      <div className={styles.toolbarGroup}>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? styles.active : ''}
          title="Bullet List"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? styles.active : ''}
          title="Numbered List"
        >
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? styles.active : ''}
          title="Quote"
        >
          &quot;
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? styles.active : ''}
          title="Code Block"
        >
          &lt;&gt;
        </button>
      </div>

      <div className={styles.toolbarGroup}>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
      </div>
    </div>
  )
}
