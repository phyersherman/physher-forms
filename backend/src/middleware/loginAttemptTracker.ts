/**
 * Login Attempt Tracker
 * Tracks failed login attempts per email address
 * Only counts failures, not successful logins
 */

interface LoginAttempt {
  count: number
  firstAttemptTime: number
  lastAttemptTime: number
}

const attempts = new Map<string, LoginAttempt>()

const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_ATTEMPTS = 10

/**
 * Check if an email is currently rate limited
 */
export const isRateLimited = (email: string): boolean => {
  const attempt = attempts.get(email.toLowerCase())
  if (!attempt) return false

  const now = Date.now()
  const timeSinceFirstAttempt = now - attempt.firstAttemptTime

  // If window has expired, clear the entry
  if (timeSinceFirstAttempt > WINDOW_MS) {
    attempts.delete(email.toLowerCase())
    return false
  }

  return attempt.count >= MAX_ATTEMPTS
}

/**
 * Record a failed login attempt
 */
export const recordFailedAttempt = (email: string): void => {
  const emailLower = email.toLowerCase()
  const attempt = attempts.get(emailLower)
  const now = Date.now()

  if (!attempt) {
    attempts.set(emailLower, {
      count: 1,
      firstAttemptTime: now,
      lastAttemptTime: now,
    })
  } else {
    // Reset if window has expired
    if (now - attempt.firstAttemptTime > WINDOW_MS) {
      attempts.set(emailLower, {
        count: 1,
        firstAttemptTime: now,
        lastAttemptTime: now,
      })
    } else {
      attempt.count++
      attempt.lastAttemptTime = now
    }
  }
}

/**
 * Clear attempts for an email (called on successful login)
 */
export const clearAttempts = (email: string): void => {
  attempts.delete(email.toLowerCase())
}

/**
 * Get remaining attempts for display
 */
export const getRemainingAttempts = (email: string): number => {
  const attempt = attempts.get(email.toLowerCase())
  if (!attempt) return MAX_ATTEMPTS

  const now = Date.now()
  if (now - attempt.firstAttemptTime > WINDOW_MS) {
    attempts.delete(email.toLowerCase())
    return MAX_ATTEMPTS
  }

  return Math.max(0, MAX_ATTEMPTS - attempt.count)
}

/**
 * Get reset time for display (in seconds)
 */
export const getResetTime = (email: string): number => {
  const attempt = attempts.get(email.toLowerCase())
  if (!attempt) return 0

  const now = Date.now()
  const timeSinceFirstAttempt = now - attempt.firstAttemptTime
  const remainingTime = WINDOW_MS - timeSinceFirstAttempt

  return Math.ceil(remainingTime / 1000) // Convert to seconds
}
