import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = req.cookies.token
    if (!token) {
      return res.status(401).json({ error: 'No token' })
    }

    const response = await fetch('http://localhost:4000/api/analytics/tenant/courses', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Backend error:', error)
      return res.status(response.status).json({ error: 'Failed to fetch analytics' })
    }

    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
