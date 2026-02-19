import React from 'react'
import styles from '../blocks.module.css'

/**
 * Reusable form components for block editors
 * Eliminates repetitive form markup across block components
 */

interface FormGroupProps {
  children: React.ReactNode
}

export const FormGroup: React.FC<FormGroupProps> = ({ children }) => (
  <div className={styles.formGroup}>{children}</div>
)

interface FormLabelProps {
  htmlFor?: string
  children: React.ReactNode
}

export const FormLabel: React.FC<FormLabelProps> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor}>{children}</label>
)

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const FormInput: React.FC<FormInputProps> = ({ label, ...props }) => (
  <FormGroup>
    {label && <FormLabel>{label}</FormLabel>}
    <input {...props} className={styles.input} />
  </FormGroup>
)

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const FormTextarea: React.FC<FormTextareaProps> = ({ label, ...props }) => (
  <FormGroup>
    {label && <FormLabel>{label}</FormLabel>}
    <textarea {...props} className={styles.textarea} />
  </FormGroup>
)

interface FormColorInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const FormColorInput: React.FC<FormColorInputProps> = ({ label, ...props }) => (
  <FormGroup>
    {label && <FormLabel>{label}</FormLabel>}
    <input {...props} type="color" className={styles.colorInput} />
  </FormGroup>
)

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Array<{ value: string; label: string }>
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, options, ...props }) => (
  <FormGroup>
    {label && <FormLabel>{label}</FormLabel>}
    <select {...props} className={styles.input}>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </FormGroup>
)
