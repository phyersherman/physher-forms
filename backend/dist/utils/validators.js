"use strict";
/**
 * Validation utilities
 * Reusable validators for user input sanitization and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationErrors = void 0;
exports.isValidEmail = isValidEmail;
exports.isValidPassword = isValidPassword;
exports.sanitizeString = sanitizeString;
exports.isValidRole = isValidRole;
exports.isValidStatus = isValidStatus;
exports.isValidUrl = isValidUrl;
/**
 * Validates email format using RFC 5322 simplified regex
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Validates password strength
 * Requirements: min 8 chars, at least 1 number, at least 1 letter
 */
function isValidPassword(password) {
    if (password.length < 8)
        return false;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    return hasNumber && hasLetter;
}
/**
 * Sanitizes string input (trim whitespace, enforce max length)
 */
function sanitizeString(input, maxLength = 255) {
    return input.trim().slice(0, maxLength);
}
/**
 * Validates user role
 */
function isValidRole(role) {
    const validRoles = ['admin', 'instructor', 'learner'];
    return validRoles.includes(role);
}
/**
 * Validates user status
 */
function isValidStatus(status) {
    const validStatuses = ['active', 'invited', 'disabled'];
    return validStatuses.includes(status);
}
/**
 * Validates URL format
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Comprehensive validation error messages
 */
exports.ValidationErrors = {
    EMAIL_INVALID: 'Invalid email format',
    EMAIL_REQUIRED: 'Email is required',
    PASSWORD_WEAK: 'Password must be at least 8 characters with at least 1 number and 1 letter',
    PASSWORD_REQUIRED: 'Password is required',
    ROLE_INVALID: 'Invalid role. Must be admin, instructor, or learner',
    STATUS_INVALID: 'Invalid status. Must be active, invited, or disabled',
    NAME_REQUIRED: 'Name is required',
    TENANT_ID_REQUIRED: 'Tenant ID is required',
    URL_INVALID: 'Invalid URL format',
};
