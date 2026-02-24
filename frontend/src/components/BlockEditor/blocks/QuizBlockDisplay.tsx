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
  timeLimitMinutes?: number
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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [isTimeUp, setIsTimeUp] = useState(false)

  // Normalize questions from various import formats to standard format
  const normalizeQuestions = (questions: any[]): QuizQuestion[] => {
    if (!questions || !Array.isArray(questions)) return []
    
    return questions.map((q, idx) => {
      // Handle different field names
      const text = q.text || q.question || ''
      const id = q.id || `q${idx + 1}`
      
      // Normalize type (multiple_choice -> multiple-choice, etc.)
      let type: QuizQuestion['type'] = 'multiple-choice'
      if (q.type) {
        const normalizedType = q.type.toLowerCase().replace(/_/g, '-')
        if (normalizedType === 'true-false' || normalizedType === 'truefalse') {
          type = 'true-false'
        } else if (normalizedType === 'short-answer' || normalizedType === 'shortanswer') {
          type = 'short-answer'
        } else {
          type = 'multiple-choice'
        }
      }
      
      // Handle correctAnswer - could be index (number), value (string), or already set
      let correctAnswer: string | string[] | undefined = q.correctAnswer
      if (correctAnswer === undefined && q.correct !== undefined && q.options) {
        // Convert index to actual answer value
        if (typeof q.correct === 'number' && q.options[q.correct] !== undefined) {
          correctAnswer = q.options[q.correct]
        } else {
          correctAnswer = String(q.correct)
        }
      }
      // Also handle 'answer' field for short-answer questions
      if (correctAnswer === undefined && q.answer !== undefined) {
        correctAnswer = q.answer
      }
      
      return {
        id,
        text,
        type,
        options: q.options,
        correctAnswer,
        points: q.points || 1
      }
    })
  }

  useEffect(() => {
    if (block.config) {
      try {
        const parsed = JSON.parse(block.config)
        // Normalize questions to standard format
        if (parsed.questions) {
          parsed.questions = normalizeQuestions(parsed.questions)
        }
        setConfig(parsed)
        // Initialize timer if time limit is set
        if (parsed.timeLimitMinutes && !quizStarted) {
          setTimeRemaining(parsed.timeLimitMinutes * 60)
        }
      } catch {
        // ignore
      }
    }
  }, [block.config, quizStarted])

  // Countdown timer effect
  useEffect(() => {
    if (!quizStarted || submitted || timeRemaining === null) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          setIsTimeUp(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizStarted, submitted, timeRemaining])

  // Auto-submit when time is up
  useEffect(() => {
    if (isTimeUp && !submitted) {
      const finalScore = calculateScore()
      setScore(finalScore)
      setSubmitted(true)
      setIsTimeUp(false)
    }
  }, [isTimeUp])

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

  const handleStartQuiz = () => {
    setQuizStarted(true)
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
    setQuizStarted(false)
    setTimeRemaining(config.timeLimitMinutes ? config.timeLimitMinutes * 60 : null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const getTimerColor = () => {
    if (!timeRemaining) return '#666'
    const totalSeconds = (config.timeLimitMinutes || 1) * 60
    const percentageRemaining = (timeRemaining / totalSeconds) * 100
    if (percentageRemaining <= 10) return '#d32f2f' // Red - urgent
    if (percentageRemaining <= 25) return '#f57c00' // Orange - warning
    return '#2e7d32' // Green - normal
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

  // Show start quiz prompt if quiz hasn't started yet
  if (!quizStarted && !submitted) {
    return (
      <div
        style={{
          marginBottom: '24px',
          padding: '32px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          textAlign: 'center',
        }}
      >
        {config.title && (
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>
            {config.title}
          </h3>
        )}

        {config.description && (
          <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
            {config.description}
          </p>
        )}

        {config.timeLimitMinutes && (
          <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '4px', color: '#1976d2', fontWeight: 600 }}>
            ⏱️ Time Limit: {config.timeLimitMinutes} minute{config.timeLimitMinutes > 1 ? 's' : ''}
          </div>
        )}

        <p style={{ marginBottom: '20px', color: '#666' }}>
          {config.questions.length} question{config.questions.length > 1 ? 's' : ''} • Passing Score: {config.passingScore || 70}%
        </p>

        <button
          onClick={handleStartQuiz}
          style={{
            padding: '12px 32px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px',
          }}
        >
          Start Quiz
        </button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          {config.title && (
            <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#333' }}>
              {config.title}
            </h3>
          )}

          {config.description && (
            <p style={{ marginBottom: '0', color: '#666', fontSize: '14px' }}>
              {config.description}
            </p>
          )}
        </div>

        {quizStarted && config.timeLimitMinutes && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: timeRemaining && timeRemaining < (config.timeLimitMinutes * 60) * 0.25 ? '#ffebee' : '#f5f5f5',
              borderRadius: '4px',
              border: `2px solid ${getTimerColor()}`,
              fontWeight: 700,
              fontSize: '18px',
              color: getTimerColor(),
              minWidth: '100px',
              textAlign: 'center',
            }}
          >
            ⏱️ {formatTime(timeRemaining || 0)}
          </div>
        )}
      </div>

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
          Score: {score}% (Passing: {config.passingScore || 70}%) {isTimeUp && '⏱️ Auto-submitted due to time limit'}
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
        {quizStarted && !submitted && (
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
