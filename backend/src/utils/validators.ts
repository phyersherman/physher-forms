/**
 * Validation utilities
 * Reusable validators for user input sanitization and validation
 */

/**
 * Validates email format using RFC 5322 simplified regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates password strength
 * Requirements: min 8 chars, at least 1 number, at least 1 letter
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false
  const hasNumber = /\d/.test(password)
  const hasLetter = /[a-zA-Z]/.test(password)
  return hasNumber && hasLetter
}

/**
 * Sanitizes string input (trim whitespace, enforce max length)
 */
export function sanitizeString(input: string, maxLength = 255): string {
  return input.trim().slice(0, maxLength)
}

/**
 * Validates user role
 */
export function isValidRole(role: string): boolean {
  const validRoles = ['admin', 'instructor', 'learner']
  return validRoles.includes(role)
}

/**
 * Validates user status
 */
export function isValidStatus(status: string): boolean {
  const validStatuses = ['active', 'invited', 'disabled']
  return validStatuses.includes(status)
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Comprehensive validation error messages
 */
export const ValidationErrors = {
  EMAIL_INVALID: 'Invalid email format',
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_WEAK: 'Password must be at least 8 characters with at least 1 number and 1 letter',
  PASSWORD_REQUIRED: 'Password is required',
  ROLE_INVALID: 'Invalid role. Must be admin, instructor, or learner',
  STATUS_INVALID: 'Invalid status. Must be active, invited, or disabled',
  NAME_REQUIRED: 'Name is required',
  TENANT_ID_REQUIRED: 'Tenant ID is required',
  URL_INVALID: 'Invalid URL format',
} as const
