import { useEffect } from 'react'
import { useRouter } from 'next/router'

/**
 * Redirect to the main course editor page.
 * Module editing is now done inline within the course editor.
 */
const EditCourseModuleRedirect: React.FC = () => {
  const router = useRouter()
  const { courseId, tenantId } = router.query

  useEffect(() => {
    if (courseId) {
      const url = tenantId 
        ? `/admin/courses/${courseId}/edit?tenantId=${tenantId}`
        : `/admin/courses/${courseId}/edit`
      router.replace(url)
    }
  }, [courseId, tenantId, router])

  return <div>Redirecting to course editor...</div>
}

export default EditCourseModuleRedirect
