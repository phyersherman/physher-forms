import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { courseId } = req.query
    const token = req.cookies['token']

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' })
    }

    const daysBack = req.query.daysBack || '30'
    const response = await fetch(
      `http://localhost:4000/api/analytics/course/${courseId}/quizzes?daysBack=${daysBack}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch analytics' })
    }

    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('[course analytics]', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
