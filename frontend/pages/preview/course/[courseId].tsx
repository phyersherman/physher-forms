import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const CoursePreview: React.FC = () => {
  const router = useRouter()
  const { courseId } = router.query
  const [course, setCourse] = useState<any>(null)

  useEffect(() => {
    if (courseId) {
      fetch(`http://localhost:4000/api/courses/${courseId}`, { credentials: 'include' })
        .then(r => r.json())
        .then(setCourse)
        .catch(() => setCourse(null))
    }
  }, [courseId])

  if (!course) return <div>Loading...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>{course.title}</h1>
      <p>{course.description}</p>
      <h2>Chapters</h2>
      {course.chapters?.map((chapter: any) => (
        <div key={chapter.id} style={{ marginBottom: 20 }}>
          <h3>{chapter.title}</h3>
          <ul>
            {chapter.modules?.map((module: any) => (
              <li key={module.id}>
                <a href={`/preview/module/${module.id}`}>{module.title}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default CoursePreview