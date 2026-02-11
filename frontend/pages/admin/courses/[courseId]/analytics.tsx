import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../../../src/components/AdminLayout'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface ScoreStatistics {
  minScore: number
  maxScore: number
  averageScore: number
  medianScore: number
  stdDeviation: number
  totalAttempts: number
}

interface PassFailBreakdown {
  passCount: number
  failCount: number
  passPercentage: number
  failPercentage: number
}

interface AttemptTrend {
  date: string
  attempts: number
  averageScore: number
  passRate: number
}

interface QuizAnalytics {
  blockId: string
  totalAttempts: number
  uniqueUsers: number
  scoreStats: ScoreStatistics
  passFailBreakdown: PassFailBreakdown
  attemptTrends: AttemptTrend[]
  scoreDistribution: Array<{
    range: string
    count: number
  }>
}

interface CourseAnalytics {
  blockId: string
  blockTitle: string
  analytics: QuizAnalytics
}

export default function CourseAnalytics() {
  const router = useRouter()
  const { courseId } = router.query
  const [loading, setLoading] = useState(true)
  const [courseName, setCourseName] = useState('')
  const [analyticsData, setAnalyticsData] = useState<CourseAnalytics[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!courseId) return

    const fetchData = async () => {
      try {
        // Fetch course details
        const courseRes = await fetch(`${API_BASE}/courses/${courseId}`, {
          credentials: 'include',
        })
        if (courseRes.ok) {
          const course = await courseRes.json()
          setCourseName(course.title)
        }

        // Fetch analytics
        const analyticsRes = await fetch(`${API_BASE}/analytics/course/${courseId}/quizzes`, {
          credentials: 'include',
        })
        if (!analyticsRes.ok) {
          throw new Error('Failed to fetch analytics')
        }
        const data = await analyticsRes.json()
        setAnalyticsData(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load analytics'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '24px', textAlign: 'center' }}>Loading analytics...</div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div style={{ padding: '24px', color: '#d32f2f' }}>Error: {error}</div>
      </AdminLayout>
    )
  }

  if (analyticsData.length === 0) {
    return (
      <AdminLayout>
        <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
          No quiz data available for this course.
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px' }}>
        <h1 style={{ marginTop: 0, marginBottom: '8px' }}>📊 Quiz Analytics</h1>
        <p style={{ marginBottom: '24px', color: '#666' }}>Course: {courseName}</p>

        {analyticsData.map((quiz) => (
          <div
            key={quiz.blockId}
            style={{
              marginBottom: '32px',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
              {quiz.blockTitle}
            </h2>

            {/* Key Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <StatCard label="Total Attempts" value={quiz.analytics.totalAttempts} />
              <StatCard label="Unique Users" value={quiz.analytics.uniqueUsers} />
              <StatCard label="Average Score" value={`${quiz.analytics.scoreStats.averageScore.toFixed(1)}%`} />
              <StatCard label="Median Score" value={`${quiz.analytics.scoreStats.medianScore.toFixed(1)}%`} />
              <StatCard label="Highest Score" value={`${quiz.analytics.scoreStats.maxScore.toFixed(1)}%`} />
              <StatCard label="Lowest Score" value={`${quiz.analytics.scoreStats.minScore.toFixed(1)}%`} />
            </div>

            {/* Pass/Fail Breakdown */}
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Pass/Fail Breakdown</h3>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Passed</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                    {quiz.analytics.passFailBreakdown.passCount}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {quiz.analytics.passFailBreakdown.passPercentage.toFixed(1)}%
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Failed</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
                    {quiz.analytics.passFailBreakdown.failCount}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {quiz.analytics.passFailBreakdown.failPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              {/* Simple bar chart */}
              <div style={{ marginTop: '12px', height: '20px', display: 'flex', overflow: 'hidden', borderRadius: '4px' }}>
                <div
                  style={{
                    width: `${quiz.analytics.passFailBreakdown.passPercentage}%`,
                    backgroundColor: '#2e7d32',
                  }}
                />
                <div
                  style={{
                    width: `${quiz.analytics.passFailBreakdown.failPercentage}%`,
                    backgroundColor: '#d32f2f',
                  }}
                />
              </div>
            </div>

            {/* Score Distribution */}
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Score Distribution</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
                {quiz.analytics.scoreDistribution.map((dist) => (
                  <div key={dist.range} style={{ textAlign: 'center' }}>
                    <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '4px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: `${(dist.count / Math.max(...quiz.analytics.scoreDistribution.map((d) => d.count))) * 120}px`,
                          backgroundColor: '#1976d2',
                          borderRadius: '4px 4px 0 0',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>{dist.count}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{dist.range}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attempt Trends */}
            {quiz.analytics.attemptTrends.length > 0 && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Attempt Trends</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd', fontWeight: 600 }}>Attempts</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd', fontWeight: 600 }}>Avg Score</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd', fontWeight: 600 }}>Pass Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quiz.analytics.attemptTrends.map((trend) => (
                        <tr key={trend.date}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{trend.date}</td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>{trend.attempts}</td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                            {trend.averageScore.toFixed(1)}%
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee', color: trend.passRate >= 70 ? '#2e7d32' : '#d32f2f' }}>
                            {trend.passRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '4px',
        border: '1px solid #e0e0e0',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>{value}</div>
    </div>
  )
}
