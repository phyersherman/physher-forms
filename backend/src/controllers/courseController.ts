import { Request, Response } from 'express'
import courseService from '../services/courseService'

const createCourse = async (req: Request, res: Response) => {
  const { title, description, tenantId, tenant_id, chapters } = req.body
  const finalTenantId = tenantId || tenant_id

  try {
    const course = await courseService.createCourse({
      title: title || 'New Course',
      description,
      tenant_id: finalTenantId,
      chapters
    })
    res.status(201).json(course)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create course'
    res.status(400).json({ error: message })
  }
}

const listGlobalCourses = async (req: Request, res: Response) => {
  try {
    const courses = await courseService.listGlobalCourses()
    res.json(courses)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list courses'
    res.status(400).json({ error: message })
  }
}

const listCourses = async (req: Request, res: Response) => {
  const tenant_id = (req.params.tenantId || (typeof req.query.tenant_id === 'string' ? req.query.tenant_id : undefined) || req.user?.tenantId) as string
  if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' })
  const courses = await courseService.listByTenant(tenant_id)
  res.json(courses)
}

const assignCourseToTenant = async (req: Request, res: Response) => {
  const { globalCourseId, tenantId, title } = req.body
  if (!globalCourseId || !tenantId) return res.status(400).json({ error: 'globalCourseId and tenantId required' })

  try {
    const titleStr = typeof title === 'string' ? title : undefined
    const course = await courseService.assignCourseToTenant(globalCourseId as string, tenantId as string, titleStr)
    res.status(201).json(course)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to assign course'
    res.status(400).json({ error: message })
  }
}

const copyCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params
  const { targetTenantId } = req.body
  if (!targetTenantId) return res.status(400).json({ error: 'targetTenantId required' })

  try {
    const course = await courseService.assignCourseToTenant(courseId as string, targetTenantId as string)
    res.status(201).json(course)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to copy course'
    res.status(400).json({ error: message })
  }
}

const deleteCourse = async (req: Request, res: Response) => {
  await courseService.deleteCourse(req.params.id as string)
  res.json({ ok: true })
}

const updateCourse = async (req: Request, res: Response) => {
  const { title, description, chapters } = req.body
  const updated = await courseService.updateCourse(req.params.id as string, { title, description, chapters })
  res.json(updated)
}

const getCourse = async (req: Request, res: Response) => {
  const c = await courseService.getById(req.params.id as string)
  if (!c) return res.status(404).json({ error: 'not found' })
  res.json(c)
}

const getModule = async (req: Request, res: Response) => {
  const m = await courseService.getModuleById(req.params.moduleId as string)
  if (!m) return res.status(404).json({ error: 'module not found' })
  res.json(m)
}

// modules
const addModule = async (req: Request, res: Response) => {
  const {
    title,
    slug,
    summary,
    order_index,
    required,
    prerequisite_module_ids,
    requires_quiz_pass_to_continue,
  } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  const chapter = await courseService.getChapterById(req.params.chapterId as string)
  if (!chapter) return res.status(404).json({ error: 'chapter not found' })
  const m = await courseService.createModule({
    chapter_id: req.params.chapterId as string,
    title,
    slug,
    summary,
    order_index,
    required,
    prerequisite_module_ids,
    requires_quiz_pass_to_continue,
    tenant_id: chapter.tenant_id || undefined,
  })
  res.status(201).json(m)
}

const updateModule = async (req: Request, res: Response) => {
  const {
    title,
    slug,
    summary,
    order_index,
    required,
    prerequisite_module_ids,
    requires_quiz_pass_to_continue,
  } = req.body
  const m = await courseService.updateModule(req.params.moduleId as string, {
    title,
    slug,
    summary,
    order_index,
    required,
    prerequisite_module_ids,
    requires_quiz_pass_to_continue,
  })
  res.json(m)
}

const deleteModule = async (req: Request, res: Response) => {
  await courseService.deleteModule(req.params.moduleId as string)
  res.json({ ok: true })
}

// chapters
const addChapter = async (req: Request, res: Response) => {
  const { title, order_index } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  const course = await courseService.getById(req.params.courseId as string)
  if (!course) return res.status(404).json({ error: 'course not found' })
  const c = await courseService.createChapter({
    course_id: req.params.courseId as string,
    title,
    order_index,
    tenant_id: course.tenant_id || undefined,
  })
  res.status(201).json(c)
}

const getChapter = async (req: Request, res: Response) => {
  const c = await courseService.getChapterById(req.params.chapterId as string)
  if (!c) return res.status(404).json({ error: 'chapter not found' })
  res.json(c)
}

const updateChapter = async (req: Request, res: Response) => {
  const { title, order_index } = req.body
  const c = await courseService.updateChapter(req.params.chapterId as string, { title, order_index })
  res.json(c)
}

const deleteChapter = async (req: Request, res: Response) => {
  await courseService.deleteChapter(req.params.chapterId as string)
  res.json({ ok: true })
}

// blocks
const addBlock = async (req: Request, res: Response) => {
  const { type, content, config, order_index } = req.body
  if (!type) return res.status(400).json({ error: 'type required' })
  const module = await courseService.getModuleById(req.params.moduleId as string)
  if (!module) return res.status(404).json({ error: 'module not found' })
  const b = await courseService.createBlock({
    module_id: req.params.moduleId as string,
    type,
    content,
    config,
    order_index,
    tenant_id: module.tenant_id || undefined,
  })
  res.status(201).json(b)
}

const updateBlock = async (req: Request, res: Response) => {
  const { type, content, config, order_index } = req.body
  const b = await courseService.updateBlock(req.params.blockId as string, { type, content, config, order_index })
  res.json(b)
}

const deleteBlock = async (req: Request, res: Response) => {
  await courseService.deleteBlock(req.params.blockId as string)
  res.json({ ok: true })
}

const listBlocksByModule = async (req: Request, res: Response) => {
  const blocks = await courseService.listBlocksByModule(req.params.moduleId as string)
  res.json(blocks)
}

const reorderBlocks = async (req: Request, res: Response) => {
  const { blocks } = req.body
  if (!Array.isArray(blocks)) {
    return res.status(400).json({ error: 'blocks must be an array' })
  }
  const updated = await courseService.reorderBlocks(req.params.moduleId as string, blocks)
  res.json(updated)
}

// Backward compatibility: add module to course (creates default chapter if needed)
const addModuleToCourse = async (req: Request, res: Response) => {
  const {
    title,
    slug,
    summary,
    order_index,
    required,
    prerequisite_module_ids,
    requires_quiz_pass_to_continue,
  } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  
  const course = await courseService.getById(req.params.courseId as string)
  if (!course) return res.status(404).json({ error: 'course not found' })
  
  // Find or create default chapter
  let chapter
  if (course.chapters && course.chapters.length > 0) {
    chapter = course.chapters[0] // Use first chapter
  } else {
    // Create default chapter
    chapter = await courseService.createChapter({
      course_id: req.params.courseId as string,
      title: 'Default Chapter',
      order_index: 0,
      tenant_id: course.tenant_id || undefined,
    })
  }
  
  const m = await courseService.createModule({
    chapter_id: chapter.id,
    title,
    slug,
    summary,
    order_index,
    required,
    prerequisite_module_ids,
    requires_quiz_pass_to_continue,
    tenant_id: course.tenant_id || undefined,
  })
  res.status(201).json(m)
}

export default { 
  createCourse, 
  listCourses,
  listGlobalCourses,
  assignCourseToTenant,
  copyCourse,
  getCourse, 
  updateCourse, 
  deleteCourse, 
  addModule, 
  getModule, 
  updateModule, 
  deleteModule,
  addChapter,
  getChapter,
  updateChapter,
  deleteChapter,
  addBlock,
  updateBlock,
  deleteBlock,
  listBlocksByModule,
  reorderBlocks,
  addModuleToCourse
}
