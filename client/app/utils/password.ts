export function validatePassword(password: string): boolean {
  if (typeof password !== 'string') {
    throw new TypeError('Password must be a string')
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}
