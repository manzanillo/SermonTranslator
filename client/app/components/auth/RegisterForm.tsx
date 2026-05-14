'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch } from '../../utils/auth'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'

interface FormState {
  name: string
  email: string
  password: string
  role: string
}

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  role?: string
}

const initialState: FormState = {
  name: '',
  email: '',
  password: '',
  role: '',
}

const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export default function RegisterForm() {
  const [form, setForm] = useState<FormState>(initialState)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateForm = () => {
    const nextErrors: FieldErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = 'Please enter your full name.'
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Please enter your email address.'
    } else if (!validateEmail(form.email.trim())) {
      nextErrors.email = 'Please provide a valid email address.'
    }

    if (!form.password) {
      nextErrors.password = 'Please create a password.'
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }

    if (!form.role) {
      nextErrors.role = 'Please select an account type.'
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
        'http://localhost:3001/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
        false,
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Unable to create your account. Please try again.')
        return
      }

      router.push('/login')
    } catch (err) {
      console.error('Registration error:', err)
      setError('Unable to reach the server. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#244722]">
            Full name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={(event) => handleChange('name', event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            required
          />
          {fieldErrors.name ? (
            <p id="name-error" className="mt-2 text-sm text-[#9b2c2c]">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

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
            value={form.email}
            onChange={(event) => handleChange('email', event.target.value)}
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
            autoComplete="new-password"
            placeholder="Create a secure password"
            value={form.password}
            onChange={(event) => handleChange('password', event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            required
          />
          {fieldErrors.password ? (
            <p id="password-error" className="mt-2 text-sm text-[#9b2c2c]">
              {fieldErrors.password}
            </p>
          ) : (
            <p className="mt-2 text-xs text-[#516a51]">
              Use at least 8 characters, including uppercase, lowercase, and a number.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="mb-2 block text-sm font-medium text-[#244722]">
            Account type
          </label>
          <Select
            id="role"
            name="role"
            value={form.role}
            onChange={(event) => handleChange('role', event.target.value)}
            aria-invalid={Boolean(fieldErrors.role)}
            aria-describedby={fieldErrors.role ? 'role-error' : undefined}
            required
          >
            <option value="">Select a role</option>
            <option value="imam">Imam</option>
            <option value="listener">Listener</option>
          </Select>
          {fieldErrors.role ? (
            <p id="role-error" className="mt-2 text-sm text-[#9b2c2c]">
              {fieldErrors.role}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#f5d0d0] bg-[#fff1f1] px-4 py-3 text-sm text-[#9b2c2c]" role="alert">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>

        <div className="text-center text-sm text-[#4c644f]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="font-semibold text-[#2d6a33] underline decoration-[#cce5d1] underline-offset-4 hover:text-[#224f28]"
          >
            Sign in
          </button>
        </div>
      </div>
    </form>
  )
}
