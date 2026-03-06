import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import api from '../../../src/lib/api'

const ModulePreview: React.FC = () => {
  const router = useRouter()
  const { moduleId } = router.query
  const [module, setModule] = useState<any>(null)

  useEffect(() => {
    if (moduleId && typeof moduleId === 'string') {
      const loadModule = async () => {
        try {
          const data = await api.getModule(moduleId)
          setModule(data)
        } catch (err) {
          setModule(null)
        }
      }
      loadModule()
    }
  }, [moduleId])

  if (!module) return <div>Loading...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>{module.title}</h1>
      <p>{module.summary}</p>
      {module.blocks?.sort((a: any, b: any) => a.order_index - b.order_index).map((block: any) => (
        <div key={block.id} style={{ marginBottom: 20 }}>
          {block.type === 'text' && <div dangerouslySetInnerHTML={{ __html: block.content }} />}
          {block.type === 'image' && <img src={block.content} alt="Image" style={{ maxWidth: '100%' }} />}
          {block.type === 'video' && (() => {
            let src = block.content || ''
            try {
              const urlObj = new URL(src)
              const host = urlObj.hostname.replace(/^www\./, '')
              if (host === 'youtube.com' || host === 'm.youtube.com') {
                const vid = urlObj.searchParams.get('v')
                if (vid) src = `https://www.youtube.com/embed/${vid}`
                else {
                  const m = urlObj.pathname.match(/\/(shorts|live|embed)\/([\w-]+)/)
                  if (m) src = `https://www.youtube.com/embed/${m[2]}`
                }
              } else if (host === 'youtu.be') {
                src = `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`
              }
            } catch {}
            return <iframe src={src} width="560" height="315" frameBorder="0" allowFullScreen />
          })()}
          {/* Add more block types */}
        </div>
      ))}
    </div>
  )
}

export default ModulePreview