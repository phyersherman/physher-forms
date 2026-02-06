import React, { useState, useEffect } from 'react'
import { IBlock } from '../types'

interface QuizQuestion {
  id: string
  text: string
  type: 'multiple-choice' | 'true-false' | 'short-answer'
  options?: string[]
  correctAnswer?: string | string[]
  points?: number
}

interface QuizConfig {
  title?: string
  description?: string
  passingScore?: number
  attemptsAllowed?: number
  requiresPassToContinue?: boolean
  questions?: QuizQuestion[]
}

interface QuizBlockDisplayProps {
  block: IBlock
}

const QuizBlockDisplay: React.FC<QuizBlockDisplayProps> = ({ block }) => {
  const [config, setConfig] = useState<QuizConfig>({})
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    if (block.config) {
      try {
        const parsed = JSON.parse(block.config)
        setConfig(parsed)
      } catch {
        // ignore
      }
    }
  }, [block.config])

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const calculateScore = () => {
    if (!config.questions || config.questions.length === 0) return 0

    let correct = 0
    let totalPoints = 0

    config.questions.forEach((q) => {
      const points = q.points || 1
      totalPoints += points

      const userAnswer = answers[q.id]
      let isCorrect = false

      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        isCorrect =
          userAnswer === q.correctAnswer ||
          (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(userAnswer))
      } else if (q.type === 'short-answer') {
        isCorrect =
          userAnswer?.toLowerCase().trim() === (q.correctAnswer as string)?.toLowerCase().trim()
      }

      if (isCorrect) correct += points
    })

    return totalPoints > 0 ? Math.round((correct / totalPoints) * 100) : 0
  }

  const handleSubmit = () => {
    const finalScore = calculateScore()
    setScore(finalScore)
    setSubmitted(true)
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(null)
  }

  if (!config.questions || config.questions.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          marginBottom: '24px',
          textAlign: 'center',
          color: '#999',
        }}
      >
        No quiz questions configured
      </div>
    )
  }

  return (
    <div
      style={{
        marginBottom: '24px',
        padding: '24px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}
    >
      {config.title && (
        <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#333' }}>
          {config.title}
        </h3>
      )}

      {config.description && (
        <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
          {config.description}
        </p>
      )}

      {submitted && score !== null && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: score >= (config.passingScore || 70) ? '#c8e6c9' : '#ffccbc',
            color: score >= (config.passingScore || 70) ? '#2e7d32' : '#d84315',
            borderRadius: '4px',
            fontWeight: 600,
          }}
        >
          Score: {score}% (Passing: {config.passingScore || 70}%)
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        {config.questions.map((question, idx) => (
          <div
            key={question.id}
            style={{
              marginBottom: '20px',
              paddingBottom: '20px',
              borderBottom: '1px solid #ddd',
            }}
          >
            <p style={{ marginTop: 0, fontWeight: 600, color: '#333' }}>
              {idx + 1}. {question.text}
              {question.points && (
                <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                  ({question.points} point{question.points !== 1 ? 's' : ''})
                </span>
              )}
            </p>

            {question.type === 'multiple-choice' && (
              <div style={{ marginLeft: '20px' }}>
                {(question.options || []).map((option, oIdx) => (
                  <label
                    key={oIdx}
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      backgroundColor:
                        submitted && answers[question.id] === option ? '#e3f2fd' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      disabled={submitted}
                      style={{ marginRight: '8px' }}
                    />
                    {option}
                    {submitted &&
                      answers[question.id] === option &&
                      option === question.correctAnswer && (
                        <span style={{ marginLeft: '8px', color: '#4caf50', fontWeight: 600 }}>
                          ✓
                        </span>
                      )}
                    {submitted &&
                      answers[question.id] === option &&
                      option !== question.correctAnswer && (
                        <span style={{ marginLeft: '8px', color: '#f44336', fontWeight: 600 }}>
                          ✗
                        </span>
                      )}
                  </label>
                ))}
              </div>
            )}

            {question.type === 'true-false' && (
              <div style={{ marginLeft: '20px' }}>
                {['True', 'False'].map((option) => (
                  <label
                    key={option}
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      backgroundColor:
                        submitted && answers[question.id] === option ? '#e3f2fd' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      disabled={submitted}
                      style={{ marginRight: '8px' }}
                    />
                    {option}
                    {submitted &&
                      answers[question.id] === option &&
                      option === question.correctAnswer && (
                        <span style={{ marginLeft: '8px', color: '#4caf50', fontWeight: 600 }}>
                          ✓
                        </span>
                      )}
                    {submitted &&
                      answers[question.id] === option &&
                      option !== question.correctAnswer && (
                        <span style={{ marginLeft: '8px', color: '#f44336', fontWeight: 600 }}>
                          ✗
                        </span>
                      )}
                  </label>
                ))}
              </div>
            )}

            {question.type === 'short-answer' && (
              <input
                type="text"
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                disabled={submitted}
                placeholder="Type your answer here"
                style={{
                  width: '100%',
                  marginLeft: '20px',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        {submitted && (
          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              background: '#f0f0f0',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retake Quiz
          </button>
        )}
        {!submitted && (
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 20px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  )
}

export default QuizBlockDisplay
