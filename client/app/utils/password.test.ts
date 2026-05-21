import { describe, expect, it } from 'vitest'
import { validatePassword } from './password'

describe('validatePassword', () => {
  it('returns true for a valid password', () => {
    const result = validatePassword('StrongP@ssw0rd')
    expect(result).toBe(true)
  })

  it('returns false for an empty string', () => {
    expect(validatePassword('')).toBe(false)
  })

  it('throws when the input is not a string', () => {
    expect(() => validatePassword(123 as any)).toThrow('Password must be a string')
  })
})
