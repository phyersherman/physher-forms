import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = req.cookies['token']
    console.log('[analytics/tenant] token exists:', !!token)
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const daysBack = req.query.daysBack || '30'
    console.log('[analytics/tenant] calling backend with token:', token.substring(0, 20) + '...')
    
    const response = await fetch(
      `http://localhost:4000/api/analytics/tenant?daysBack=${daysBack}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    console.log('[analytics/tenant] backend response:', response.status, data)
    
    if (!response.ok) {
      console.error('[tenant analytics error]', response.status, data)
      return res.status(response.status).json({ error: data.error || 'Failed to fetch analytics' })
    }

    res.status(200).json(data)
  } catch (error) {
    console.error('[tenant analytics]', error)
    res.status(500).json({ error: 'Internal server error', details: String(error) })
  }
}
