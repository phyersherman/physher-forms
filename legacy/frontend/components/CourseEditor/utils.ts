import { IBlock } from '../BlockEditor/types'
import { Chapter, Module } from './types'

/**
 * Creates a new chapter with no default modules
 */
export function createChapter(title: string): Chapter {
  const timestamp = Date.now()
  
  return {
    id: `chapter-${timestamp}`,
    title,
    modules: [],
    prerequisiteChapterIds: [],
  }
}

/**
 * Creates a new empty module
 */
export function createModule(title: string, orderIndex: number = 0): Module {
  const timestamp = Date.now()
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  
  return {
    id: `module-${timestamp}`,
    title,
    slug,
    summary: '',
    blocks: [],
    order_index: orderIndex,
  }
}

/**
 * Generates a slug from a title
 */
export function generateSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/**
 * Reorders an array by moving an item from one index to another
 */
export function reorderArray<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...arr]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

/**
 * Moves an item up or down in an array
 */
export function moveItem<T>(arr: T[], index: number, direction: 'up' | 'down'): T[] {
  if (direction === 'up' && index === 0) return arr
  if (direction === 'down' && index === arr.length - 1) return arr
  
  const newIndex = direction === 'up' ? index - 1 : index + 1
  return reorderArray(arr, index, newIndex)
}

/**
 * Creates a quiz block for chapter assessments
 */
export function createQuizBlock(title: string, required: boolean = false): IBlock {
  return {
    id: `quiz-${Date.now()}`,
    type: 'quiz',
    content: title,
    config: JSON.stringify({
      title,
      questions: [],
      passingScore: 70,
      allowMultipleAttempts: true,
      required,
    }),
    order_index: 0,
  }
}
