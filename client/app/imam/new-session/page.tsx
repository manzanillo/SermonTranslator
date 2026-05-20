'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch } from '../../utils/auth'

export default function NewSessionPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ title?: string; description?: string; submit?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: { title?: string; description?: string } = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (!description.trim()) newErrors.description = 'Description is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const res = await authFetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      })

      if (res.ok) {
        // Successfully created. We navigate to the session screen.
        // For now, this is the existing SermonTranslator wrapper.
        router.push('/imam/session')
      } else {
        const data = await res.json()
        setErrors({ submit: data.error || 'Failed to start session' })
      }
    } catch (err) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F8F5] relative">
      {/* Top Logo */}
      <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none">
        <h1 className="font-serif text-2xl font-bold tracking-[-0.04em] text-[#288C49]">
          Zermon
        </h1>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-8 pt-32 pb-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/imam')}
          className="mb-8 w-max text-[#288C49] hover:text-[#1a6632] transition-colors"
          aria-label="Go back"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col relative">
          
          <div className="mb-6">
            <input
              type="text"
              placeholder="Enter title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }))
              }}
              className="w-full bg-transparent border-none outline-none font-serif text-4xl sm:text-5xl font-bold text-[#144f2d] placeholder-[#144f2d]/40"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-2 text-sm font-medium text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="flex-1">
            <textarea
              placeholder="Enter description..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) setErrors(prev => ({ ...prev, description: undefined }))
              }}
              className="w-full h-full min-h-[200px] bg-transparent border-none outline-none text-[#4c6e4e] placeholder-[#4c6e4e]/50 text-lg leading-relaxed resize-none"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-2 text-sm font-medium text-red-600">{errors.description}</p>
            )}
          </div>

          {errors.submit && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 border border-red-100">
              <p className="text-sm font-medium text-red-800 text-center">{errors.submit}</p>
            </div>
          )}

          {/* Bottom Button */}
          <div className="mt-8 flex justify-center pb-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#288C49] px-14 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-[#1a6632] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Starting...' : 'Go live'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
