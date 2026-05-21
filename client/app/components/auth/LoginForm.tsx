'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch } from '../../utils/auth'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface FieldErrors {
  email?: string
  password?: string
}

const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const validateForm = () => {
    const nextErrors: FieldErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'Please enter your email address.'
    } else if (!validateEmail(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Please enter your password.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await authFetch(
        '/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
        false,
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Unable to sign in. Please check your credentials.')
        return
      }

      // Cache the user for instant client-side rendering (CSR) layout load
      const { setCachedUser } = require('../../utils/auth')
      setCachedUser(data.user)

      if (data.user.role === 'imam') {
        router.push('/imam')
      } else {
        router.push('/listener')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Unable to reach the server. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#244722]">
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setFieldErrors((prev) => ({ ...prev, email: '' }))
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            required
          />
          {fieldErrors.email ? (
            <p id="email-error" className="mt-2 text-sm text-[#9b2c2c]">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#244722]">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setFieldErrors((prev) => ({ ...prev, password: '' }))
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            required
          />
          {fieldErrors.password ? (
            <p id="password-error" className="mt-2 text-sm text-[#9b2c2c]">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#f5d0d0] bg-[#fff1f1] px-4 py-3 text-sm text-[#9b2c2c]" role="alert" data-cy="error-message">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <div className="text-center text-sm text-[#4c644f]">
          New to Zermon?{' '}
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="font-semibold text-[#2d6a33] underline decoration-[#cce5d1] underline-offset-4 hover:text-[#224f28]"
          >
            Create account
          </button>
        </div>
      </div>
    </form>
  )
}
