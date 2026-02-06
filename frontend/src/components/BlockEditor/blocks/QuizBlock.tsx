import React, { useState, useEffect } from 'react'
import { IBlock, BlockProps } from '../types'
import styles from './blocks.module.css'

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

const QuizBlock: React.FC<BlockProps> = ({
  block,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [config, setConfig] = useState<QuizConfig>({
    title: '',
    description: '',
    passingScore: 70,
    attemptsAllowed: 1,
    requiresPassToContinue: false,
    questions: [],
  })

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

  const handleBlur = () => {
    onUpdate({ config: JSON.stringify(config) })
  }

  const handleConfigChange = (key: keyof QuizConfig, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
  }

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      text: '',
      type: 'multiple-choice',
      options: ['', ''],
      correctAnswer: '',
      points: 1,
    }
    const newConfig = {
      ...config,
      questions: [...(config.questions || []), newQuestion],
    }
    setConfig(newConfig)
  }

  const updateQuestion = (qId: string, updates: Partial<QuizQuestion>) => {
    const newQuestions = (config.questions || []).map(q =>
      q.id === qId ? { ...q, ...updates } : q
    )
    const newConfig = { ...config, questions: newQuestions }
    setConfig(newConfig)
  }

  const deleteQuestion = (qId: string) => {
    const newQuestions = (config.questions || []).filter(q => q.id !== qId)
    const newConfig = { ...config, questions: newQuestions }
    setConfig(newConfig)
  }

  const addOption = (qId: string) => {
    updateQuestion(qId, {
      options: [...((config.questions?.find(q => q.id === qId)?.options) || []), ''],
    })
  }

  const updateOption = (qId: string, optIndex: number, text: string) => {
    const question = config.questions?.find(q => q.id === qId)
    if (!question) return
    const newOptions = [...(question.options || [])]
    newOptions[optIndex] = text
    updateQuestion(qId, { options: newOptions })
  }

  return (
    <div className={styles.block}>
      <div className={styles.blockHeader} onClick={onToggleExpand}>
        <div className={styles.blockInfo}>
          <span className={styles.blockType}>❓ Quiz</span>
          <span className={styles.blockPreview}>
            {config.title || '(Quiz configuration)'}
          </span>
        </div>
        <button className={styles.expandButton}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.blockContent}>
          <div className={styles.formGroup}>
            <label>Quiz Title</label>
            <input
              type="text"
              value={config.title || ''}
              onChange={(e) => handleConfigChange('title', e.target.value)}
              onBlur={handleBlur}
              placeholder="Enter quiz title"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={config.description || ''}
              onChange={(e) => handleConfigChange('description', e.target.value)}
              onBlur={handleBlur}
              placeholder="Quiz description"
              rows={3}
              className={styles.textarea}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className={styles.formGroup}>
              <label>Passing Score (%)</label>
              <input
                type="number"
                value={config.passingScore || 70}
                onChange={(e) => handleConfigChange('passingScore', parseInt(e.target.value))}
                onBlur={handleBlur}
                min="0"
                max="100"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Attempts Allowed</label>
              <input
                type="number"
                value={config.attemptsAllowed || 1}
                onChange={(e) => handleConfigChange('attemptsAllowed', parseInt(e.target.value))}
                onBlur={handleBlur}
                min="1"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={config.requiresPassToContinue || false}
                onChange={(e) => handleConfigChange('requiresPassToContinue', e.target.checked)}
                onBlur={handleBlur}
              />
              Passing is required to continue to next module
            </label>
          </div>

          <div style={{ padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            💡 <strong>Questions:</strong> Add and configure quiz questions below.
          </div>

          {/* Questions Section */}
          <div style={{ marginBottom: '16px', borderTop: '1px solid #e0e0e0', paddingTop: '12px' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>Questions ({config.questions?.length || 0})</h4>

            {(config.questions || []).map((question) => (
              <div key={question.id} style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={question.text || ''}
                    onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                    onBlur={handleBlur}
                    placeholder="Question text"
                    style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontWeight: 600 }}
                  />
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    style={{ marginLeft: '8px', padding: '6px 12px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Remove
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Type</label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuizQuestion['type'] })}
                      onBlur={handleBlur}
                      style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="short-answer">Short Answer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Points</label>
                    <input
                      type="number"
                      value={question.points || 1}
                      onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) })}
                      onBlur={handleBlur}
                      min="1"
                      style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* Options for multiple choice or true/false */}
                {(question.type === 'multiple-choice' || question.type === 'true-false') && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Options</label>
                    {(question.options || []).map((option, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(question.id, idx, e.target.value)}
                          onBlur={handleBlur}
                          placeholder={`Option ${idx + 1}`}
                          style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={question.correctAnswer === option}
                            onChange={() => updateQuestion(question.id, { correctAnswer: option })}
                            onBlur={handleBlur}
                          />
                          Correct
                        </label>
                      </div>
                    ))}
                    {question.type === 'multiple-choice' && (
                      <button
                        onClick={() => addOption(question.id)}
                        style={{ fontSize: '12px', padding: '6px 12px', background: '#e3f2fd', color: '#1976d2', border: '1px solid #1976d2', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}

                {/* Short answer */}
                {question.type === 'short-answer' && (
                  <div className={styles.formGroup}>
                    <label>Sample Correct Answer</label>
                    <input
                      type="text"
                      value={question.correctAnswer as string || ''}
                      onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                      onBlur={handleBlur}
                      placeholder="Reference answer"
                      className={styles.input}
                    />
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addQuestion}
              style={{ width: '100%', padding: '10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
            >
              + Add Question
            </button>
          </div>

          <button
            className={styles.deleteButton}
            onClick={onDelete}
          >
            Delete Block
          </button>
        </div>
      )}
    </div>
  )
}

export default QuizBlock
