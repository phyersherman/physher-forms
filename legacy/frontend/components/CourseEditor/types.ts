import { IBlock } from '../BlockEditor/types'

export interface Module {
  id: string
  title: string
  slug: string
  summary?: string
  blocks?: IBlock[]
  order_index?: number
}

export interface Chapter {
  id: string
  title: string
  modules: Module[]
  assessmentTitle?: string
  assessmentRequired?: boolean
  prerequisiteChapterIds?: string[]
  order_index?: number
}

export interface CourseData {
  id?: string
  title: string
  description?: string
  chapters: Chapter[]
  tenantId?: string | null
}

export type EditorMode = 'create' | 'edit'
export type EntityType = 'course' | 'template'

export interface CourseEditorProps {
  mode: EditorMode
  entityType: EntityType
  entityId?: string
  tenantId?: string | null
  initialData?: CourseData
  onSave: (data: CourseData) => Promise<void>
  onDelete?: () => Promise<void>
  backUrl: string
  backLabel?: string
}
