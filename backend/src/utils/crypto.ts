/**
 * Cryptographic utilities
 * AES-256-GCM encryption for sensitive data (API keys, etc.)
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Derive encryption key from master secret using PBKDF2
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha256')
}

/**
 * Get encryption secret from environment (must be set)
 * In production, this should be a strong random key stored securely
 */
function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable must be set')
  }
  if (secret.length < 32) {
    throw new Error('ENCRYPTION_SECRET must be at least 32 characters')
  }
  return secret
}

/**
 * Encrypts a plaintext string
 * Returns base64-encoded string: salt:iv:encrypted:tag
 */
export function encrypt(plaintext: string): string {
  const secret = getEncryptionSecret()
  
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  
  // Derive key from secret + salt
  const key = deriveKey(secret, salt)
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  // Encrypt
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  // Get authentication tag
  const tag = cipher.getAuthTag()
  
  // Combine: salt:iv:encrypted:tag (all base64)
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    encrypted,
    tag.toString('base64'),
  ].join(':')
}

/**
 * Decrypts an encrypted string (from encrypt function)
 * Input format: salt:iv:encrypted:tag (base64-encoded)
 */
export function decrypt(encryptedData: string): string {
  const secret = getEncryptionSecret()
  
  // Parse components
  const parts = encryptedData.split(':')
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format')
  }
  
  const salt = Buffer.from(parts[0], 'base64')
  const iv = Buffer.from(parts[1], 'base64')
  const encrypted = parts[2]
  const tag = Buffer.from(parts[3], 'base64')
  
  // Derive key from secret + salt
  const key = deriveKey(secret, salt)
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  
  // Decrypt
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Test if environment is properly configured for encryption
 */
export function testEncryption(): boolean {
  try {
    const testData = 'test-encryption-key-12345'
    const encrypted = encrypt(testData)
    const decrypted = decrypt(encrypted)
    return decrypted === testData
  } catch (error) {
    console.error('Encryption test failed:', error)
    return false
  }
}
