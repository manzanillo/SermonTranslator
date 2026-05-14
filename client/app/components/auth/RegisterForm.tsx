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

const initialState: FormState = {
  name: '',
  email: '',
  password: '',
  role: '',
}

export default function RegisterForm() {
  const [form, setForm] = useState<FormState>(initialState)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!form.role) {
      setError('Please choose a role before continuing.')
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
            required
          />
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
            required
          />
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
            required
          />
          <p className="mt-2 text-xs text-[#516a51]">
            Use at least 8 characters, including uppercase, lowercase, and a number.
          </p>
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
            required
          >
            <option value="">Select a role</option>
            <option value="imam">Imam</option>
            <option value="listener">Listener</option>
          </Select>
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
