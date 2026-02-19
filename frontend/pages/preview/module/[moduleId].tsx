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
          {block.type === 'video' && <iframe src={block.content} width="560" height="315" frameBorder="0" allowFullScreen />}
          {/* Add more block types */}
        </div>
      ))}
    </div>
  )
}

export default ModulePreview