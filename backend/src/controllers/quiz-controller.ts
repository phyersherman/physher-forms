import { Request, Response } from 'express'
import quizService from '../services/quiz-service'

const submitQuizAttempt = async (req: Request, res: Response) => {
  try {
    const { blockId, courseId, answers } = req.body
    const userId = req.user?.id as string
    const tenantId = req.user?.tenantId as string

    if (!blockId || !courseId || !answers || !userId || !tenantId) {
      return res.status(400).json({
        error: 'blockId, courseId, and answers are required',
      })
    }

    const result = await quizService.submitQuizAttempt({
      blockId,
      userId,
      tenantId,
      courseId,
      answers,
    })

    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit quiz'
    console.error('[submitQuizAttempt]', message)
    res.status(400).json({ error: message })
  }
}

const checkModuleAccess = async (req: Request, res: Response) => {
  try {
    const moduleId = req.params.moduleId as string
    const courseId = req.params.courseId as string
    const userId = req.user?.id as string

    if (!moduleId || !courseId || !userId) {
      return res.status(400).json({
        error: 'moduleId, courseId, and user ID are required',
      })
    }

    const result = await quizService.isModuleAccessible(moduleId, userId, courseId)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to check module access'
    console.error('[checkModuleAccess]', message)
    res.status(400).json({ error: message })
  }
}

const markModuleComplete = async (req: Request, res: Response) => {
  try {
    const { moduleId, courseId } = req.body
    const userId = req.user?.id as string
    const tenantId = req.user?.tenantId as string

    if (!moduleId || !courseId || !userId) {
      return res.status(400).json({
        error: 'moduleId and courseId are required',
      })
    }

    const completion = await quizService.markModuleComplete(
      moduleId,
      userId,
      courseId,
      tenantId
    )

    res.json(completion)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark module complete'
    console.error('[markModuleComplete]', message)
    res.status(400).json({ error: message })
  }
}

const getQuizAttempts = async (req: Request, res: Response) => {
  try {
    const blockId = req.params.blockId as string
    const userId = req.user?.id as string

    if (!blockId || !userId) {
      return res.status(400).json({
        error: 'blockId required',
      })
    }

    const attempts = await quizService.getQuizAttempts(blockId, userId)
    res.json(attempts)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get quiz attempts'
    console.error('[getQuizAttempts]', message)
    res.status(400).json({ error: message })
  }
}

const getLatestQuizAttempt = async (req: Request, res: Response) => {
  try {
    const blockId = req.params.blockId as string
    const userId = req.user?.id as string

    if (!blockId || !userId) {
      return res.status(400).json({
        error: 'blockId required',
      })
    }

    const attempt = await quizService.getLatestQuizAttempt(blockId, userId)
    res.json(attempt || null)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get latest quiz attempt'
    console.error('[getLatestQuizAttempt]', message)
    res.status(400).json({ error: message })
  }
}

export default {
  submitQuizAttempt,
  checkModuleAccess,
  markModuleComplete,
  getQuizAttempts,
  getLatestQuizAttempt,
}
