'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch } from '../../utils/auth'

export default function NewForumPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<{ title?: string; content?: string; submit?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { title?: string; content?: string } = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (!content.trim()) newErrors.content = 'Question text is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const res = await authFetch('http://localhost:3001/api/forums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })

      if (res.ok) {
        // Successfully posted. Route back to the forum overview page.
        router.push('/discuss')
      } else {
        const data = await res.json()
        setErrors({ submit: data.error || 'Failed to publish post' })
      }
    } catch (err) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const placeholderContent = 'State your question'

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F8F5] relative">
      {/* Top Centered Brand Logo */}
      <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none">
        <h1 className="font-serif text-2xl font-bold tracking-[-0.04em] text-[#288C49]">
          Zermon
        </h1>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-8 pt-32 pb-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/discuss')}
          className="mb-8 w-max text-[#288C49] hover:text-[#1a6632] transition-colors"
          aria-label="Go back to forum list"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* Post Creation Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col relative">
          
          {/* Forum Title Input */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Enter question"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }))
              }}
              className="w-full bg-transparent border-none outline-none font-serif text-4xl sm:text-5xl font-bold text-[#0c3b28] placeholder-[#0c3b28]/30 focus:ring-0 leading-tight"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-2 text-sm font-semibold text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Forum Body Content Textarea */}
          <div className="flex-1">
            <textarea
              placeholder={placeholderContent}
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                if (errors.content) setErrors(prev => ({ ...prev, content: undefined }))
              }}
              className="w-full h-full min-h-[320px] bg-transparent border-none outline-none text-[#4c6e4e] placeholder-[#4c6e4e]/40 text-lg leading-relaxed resize-none focus:ring-0"
              disabled={isSubmitting}
            />
            {errors.content && (
              <p className="mt-2 text-sm font-semibold text-red-600">{errors.content}</p>
            )}
          </div>

          {errors.submit && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 border border-red-100">
              <p className="text-sm font-semibold text-red-800 text-center">{errors.submit}</p>
            </div>
          )}

          {/* Bottom Center Submit Button */}
          <div className="mt-8 flex justify-center pb-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#288C49] px-16 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-[#1a6632] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
