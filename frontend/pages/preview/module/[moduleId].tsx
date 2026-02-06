import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const ModulePreview: React.FC = () => {
  const router = useRouter()
  const { moduleId } = router.query
  const [module, setModule] = useState<any>(null)

  useEffect(() => {
    if (moduleId) {
      fetch(`http://localhost:4000/api/modules/${moduleId}`, { credentials: 'include' })
        .then(r => r.json())
        .then(setModule)
        .catch(() => setModule(null))
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