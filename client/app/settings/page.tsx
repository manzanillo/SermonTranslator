'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../components/dashboard/AppShell'
import { authFetch, getCachedUser, setCachedUser } from '../utils/auth'
import { validatePassword } from '../utils/password'
import { User } from '../types'
import { Input } from '../components/ui/input'


export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(() => getCachedUser())
  const [loading, setLoading] = useState(() => !getCachedUser())
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordAgain, setNewPasswordAgain] = useState('')

  const [fieldErrors, setFieldErrors] = useState<{
    oldPassword?: string
    newPassword?: string
    newPasswordAgain?: string
  }>({})
  const [generalError, setGeneralError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    // Set document title for SEO and browser tab identity
    document.title = 'Settings - Sermon Translator'

    const init = async () => {
      try {
        const authRes = await authFetch('http://localhost:3001/api/auth/me')
        if (!authRes.ok) throw new Error('Not authorized')
        const authData = await authRes.json()
        setUser(authData.user)
        setCachedUser(authData.user)
      } catch (err) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const validateForm = () => {
    const nextErrors: typeof fieldErrors = {}
    let isValid = true

    if (!oldPassword) {
      nextErrors.oldPassword = 'Old password is required'
      isValid = false
    }

    if (!newPassword) {
      nextErrors.newPassword = 'New password is required'
      isValid = false
    } else if (!validatePassword(newPassword)) {
      nextErrors.newPassword = 'Password must be 8+ characters, contain uppercase, lowercase, a number, and a special character.'
      isValid = false
    }

    if (!newPasswordAgain) {
      nextErrors.newPasswordAgain = 'Please confirm your new password'
      isValid = false
    } else if (newPassword !== newPasswordAgain) {
      nextErrors.newPasswordAgain = 'Passwords do not match'
      isValid = false
    }

    setFieldErrors(nextErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')
    setSuccessMessage('')

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const res = await authFetch('http://localhost:3001/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setGeneralError(data.error || 'Failed to update password. Please try again.')
      } else {
        setSuccessMessage('Password changed successfully!')
        setOldPassword('')
        setNewPassword('')
        setNewPasswordAgain('')
        setFieldErrors({})
      }
    } catch (err) {
      setGeneralError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8F5]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#288C49] border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <AppShell user={user}>
      <div className="flex flex-col pt-12 pb-16 px-8 w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <h1 className="font-serif text-4xl font-bold tracking-[-0.03em] text-[#0c3b28]">
            Settings
          </h1>
          <p className="mt-2 text-base text-[#4c6e4e]">
            Manage your account settings and update your security preferences.
          </p>
        </div>

        {/* Change Password Card */}
        <div className="bg-white/80 border border-[#dbeade] rounded-2xl p-8 backdrop-blur-sm shadow-sm max-w-2xl mx-auto w-full">
          <h2 className="font-serif text-2xl font-bold text-[#0c3b28] mb-6">
            Change password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Old Password Input */}
            <div>
              <label htmlFor="oldPassword" className="mb-2 block text-sm font-medium text-[#244722]">
                Old password
              </label>
              <Input
                id="oldPassword"
                type="password"
                placeholder="Enter old password"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value)
                  if (fieldErrors.oldPassword) setFieldErrors(prev => ({ ...prev, oldPassword: undefined }))
                }}
                disabled={isSubmitting}
                className={fieldErrors.oldPassword ? 'border-red-500 focus:ring-red-200' : ''}
              />
              {fieldErrors.oldPassword && (
                <p className="mt-2 text-sm font-semibold text-red-600">{fieldErrors.oldPassword}</p>
              )}
            </div>

            {/* New Password Input */}
            <div>
              <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-[#244722]">
                New password
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: undefined }))
                }}
                disabled={isSubmitting}
                className={fieldErrors.newPassword ? 'border-red-500 focus:ring-red-200' : ''}
              />
              {fieldErrors.newPassword && (
                <p className="mt-2 text-sm font-semibold text-red-600">{fieldErrors.newPassword}</p>
              )}
            </div>

            {/* Confirm New Password Input */}
            <div>
              <label htmlFor="newPasswordAgain" className="mb-2 block text-sm font-medium text-[#244722]">
                Confirm new password
              </label>
              <Input
                id="newPasswordAgain"
                type="password"
                placeholder="Enter new password again"
                value={newPasswordAgain}
                onChange={(e) => {
                  setNewPasswordAgain(e.target.value)
                  if (fieldErrors.newPasswordAgain) setFieldErrors(prev => ({ ...prev, newPasswordAgain: undefined }))
                }}
                disabled={isSubmitting}
                className={fieldErrors.newPasswordAgain ? 'border-red-500 focus:ring-red-200' : ''}
              />
              {fieldErrors.newPasswordAgain && (
                <p className="mt-2 text-sm font-semibold text-red-600">{fieldErrors.newPasswordAgain}</p>
              )}
            </div>

            {/* Banner Alerts */}
            {generalError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2.5" role="alert">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{generalError}</span>
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl border border-[#c6e2cd] bg-[#f3faf4] px-4 py-3 text-sm text-[#0c3b28] flex items-start gap-2.5" role="alert">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5 text-[#288C49]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* Left Aligned Green Save Button */}
            <div className="pt-2 flex justify-start">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#288C49] text-white px-10 py-3 rounded-lg font-semibold shadow-sm hover:bg-[#1a6632] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
