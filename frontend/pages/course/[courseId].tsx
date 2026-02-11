import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import styles from '../../styles/admin-dashboard.module.css'

interface Module {
  id: string
  title: string
  summary?: string
  order_index: number
  blocks: Block[]
}

interface Block {
  id: string
  type: string
  content?: string
  config?: string
}

interface Chapter {
  id: string
  title: string
  modules: Module[]
}

interface Course {
  id: string
  title: string
  description?: string
  chapters: Chapter[]
}

interface ModuleAccessStatus {
  accessible: boolean
  reason?: string
}

const CourseViewPage: React.FC = () => {
  const router = useRouter()
  const { courseId } = router.query
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedChapterIds, setExpandedChapterIds] = useState<string[]>([])
  const [moduleAccessStatus, setModuleAccessStatus] = useState<Record<string, ModuleAccessStatus>>({})
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId || typeof courseId !== 'string') return

    const fetchCourse = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to fetch course')
        const data = await res.json()
        setCourse(data)
        setLoading(false)

        // Check access for all modules
        if (data.chapters) {
          for (const chapter of data.chapters) {
            for (const module of chapter.modules) {
              checkModuleAccess(module.id, courseId)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching course:', err)
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const checkModuleAccess = async (moduleId: string, cId: string) => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/modules/${moduleId}/courses/${cId}/access`,
        {
          credentials: 'include',
        }
      )
      const status = (await res.json()) as ModuleAccessStatus
      setModuleAccessStatus(prev => ({
        ...prev,
        [moduleId]: status,
      }))
    } catch (err) {
      console.error('Error checking module access:', err)
    }
  }

  const toggleChapter = (chapterId: string) => {
    setExpandedChapterIds(prev =>
      prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Loading course...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Course not found</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', padding: '24px' }}>
      {/* Left sidebar: Course outline */}
      <div
        style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>
          {course.title}
        </h2>

        {course.chapters.map(chapter => (
          <div key={chapter.id} style={{ marginBottom: '8px' }}>
            <button
              onClick={() => toggleChapter(chapter.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                background: expandedChapterIds.includes(chapter.id) ? '#f0f4ff' : '#fafbfc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                color: '#333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{chapter.title}</span>
              <span style={{ fontSize: '12px' }}>
                {expandedChapterIds.includes(chapter.id) ? '▼' : '▶'}
              </span>
            </button>

            {expandedChapterIds.includes(chapter.id) && (
              <div style={{ paddingLeft: '12px', marginTop: '8px' }}>
                {chapter.modules.map(module => {
                  const status = moduleAccessStatus[module.id]
                  const isLocked = status && !status.accessible

                  return (
                    <button
                      key={module.id}
                      onClick={() => !isLocked && setSelectedModuleId(module.id)}
                      disabled={isLocked}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        marginBottom: '6px',
                        background: selectedModuleId === module.id ? '#667eea' : '#f9fafb',
                        color: selectedModuleId === module.id ? 'white' : isLocked ? '#999' : '#333',
                        border: selectedModuleId === module.id ? '1px solid #667eea' : '1px solid #e2e8f0',
                        borderRadius: '4px',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        opacity: isLocked ? 0.6 : 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      title={isLocked ? status?.reason : ''}
                    >
                      <span>{module.title}</span>
                      {isLocked && <span style={{ fontSize: '12px' }}>🔒</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right side: Module content */}
      <div
        style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '24px',
        }}
      >
        {selectedModuleId ? (
          <ModuleView
            courseId={courseId as string}
            moduleId={selectedModuleId}
            onModuleSelect={setSelectedModuleId}
          />
        ) : (
          <div style={{ color: '#999', textAlign: 'center', padding: '40px 20px' }}>
            <p>Select a module to view its content</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface ModuleViewProps {
  courseId: string
  moduleId: string
  onModuleSelect: (moduleId: string) => void
}

const ModuleView: React.FC<ModuleViewProps> = ({ courseId, moduleId, onModuleSelect }) => {
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/modules/${moduleId}`, {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to fetch module')
        const data = await res.json()
        setModule(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching module:', err)
        setLoading(false)
      }
    }

    fetchModule()
  }, [moduleId])

  if (loading) {
    return <p>Loading module...</p>
  }

  if (!module) {
    return <p>Module not found</p>
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', color: '#333' }}>
        {module.title}
      </h2>

      {module.summary && (
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          {module.summary}
        </p>
      )}

      <div style={{ marginBottom: '24px' }}>
        {module.blocks && module.blocks.length > 0 ? (
          module.blocks.map((block, idx) => (
            <BlockRenderer key={block.id} block={block} courseId={courseId} />
          ))
        ) : (
          <p style={{ color: '#999' }}>No content in this module</p>
        )}
      </div>
    </div>
  )
}

interface BlockRendererProps {
  block: Block
  courseId: string
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block, courseId }) => {
  if (block.type === 'text') {
    return (
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: block.content || '' }} />
      </div>
    )
  }

  if (block.type === 'image') {
    const config = block.config ? JSON.parse(block.config) : {}
    return (
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <img
          src={config.url || block.content}
          alt={config.alt || 'Block image'}
          style={{ maxWidth: '100%', borderRadius: '8px' }}
        />
        {config.caption && (
          <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
            {config.caption}
          </p>
        )}
      </div>
    )
  }

  if (block.type === 'video') {
    const config = block.config ? JSON.parse(block.config) : {}
    return (
      <div style={{ marginBottom: '20px' }}>
        <iframe
          width="100%"
          height="400"
          src={config.url || block.content}
          title="Embedded video"
          frameBorder="0"
          allowFullScreen
          style={{ borderRadius: '8px' }}
        />
      </div>
    )
  }

  if (block.type === 'quiz') {
    return (
      <div style={{ marginBottom: '20px' }}>
        {/* QuizBlockDisplay would be imported here */}
        <div style={{ padding: '20px', background: '#f0f4ff', borderRadius: '8px' }}>
          <p style={{ color: '#333', fontWeight: 600 }}>📋 Quiz/Assignment</p>
          <p style={{ color: '#666', fontSize: '13px' }}>
            This module contains a quiz. Answer the questions to proceed.
          </p>
        </div>
      </div>
    )
  }

  if (block.type === 'quote') {
    const config = block.config ? JSON.parse(block.config) : {}
    return (
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          borderLeft: `4px solid ${config.borderColor || '#667eea'}`,
          background: config.backgroundColor || '#f9fafb',
          borderRadius: '4px',
        }}
      >
        <p style={{ fontSize: '16px', fontStyle: 'italic', color: config.textColor || '#333' }}>
          "{block.content || 'Quote'}"
        </p>
        {config.attribution && (
          <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
            — {config.attribution}
          </p>
        )}
      </div>
    )
  }

  if (block.type === 'button') {
    const config = block.config ? JSON.parse(block.config) : {}
    return (
      <div
        style={{
          marginBottom: '20px',
          textAlign: config.alignment === 'center' ? 'center' : config.alignment === 'right' ? 'right' : 'left',
        }}
      >
        <a
          href={config.url || '#'}
          target={config.openInNewTab ? '_blank' : '_self'}
          rel="noreferrer"
          style={{
            display: 'inline-block',
            padding: config.size === 'small' ? '8px 16px' : config.size === 'large' ? '14px 28px' : '10px 20px',
            background: config.backgroundColor || '#667eea',
            color: config.textColor || 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          {block.content || 'Click Here'}
        </a>
      </div>
    )
  }

  return null
}

export default CourseViewPage
