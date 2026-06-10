'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../components/dashboard/AppShell'
import LiveSermons from '../components/dashboard/LiveSermons'
import { authFetch, getCachedUser, setCachedUser } from '../utils/auth'
import { User } from '../types'

export default function ListenerPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEndedToast, setShowEndedToast] = useState(false)
  const [toastTitle, setToastTitle] = useState<string | null>(null)
  const [toastBody, setToastBody] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuthorization = async () => {
      const cachedUser = getCachedUser()
      if (cachedUser) {
        setUser(cachedUser)
      }

      try {
        const response = await authFetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user.role === 'listener') {
            setUser(data.user)
            setCachedUser(data.user)
          } else {
            router.push('/imam')
          }
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuthorization()
  }, [router])

  // Detect screen size for responsive popup styles
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('ended') === 'true') {
      setToastTitle('Session Ended')
      setToastBody('The imam has ended the current live session.')
      setShowEndedToast(true)
    }
  }, [])

  // Listen for push payloads from the service worker and show an in-app toast
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handler = (event: MessageEvent) => {
        const data = event.data
        if (data && data.type === 'push' && data.payload) {
          setToastTitle(data.payload.title || null)
          setToastBody(data.payload.body || null)
          setShowEndedToast(true)
        }
      }

      navigator.serviceWorker.addEventListener('message', handler)
      return () => navigator.serviceWorker.removeEventListener('message', handler)
    }
  }, [])

  // Auto-dismiss the toast on desktop after 4 seconds
  useEffect(() => {
    if (showEndedToast && !isMobile) {
      const timer = setTimeout(() => {
        setShowEndedToast(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showEndedToast, isMobile])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef7ec]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#288C49] border-t-transparent" />
          <p className="mt-4 text-sm text-[#4c6e4e]">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <AppShell user={user}>
      <LiveSermons user={user} />

      {/* Custom UI Session Ended Notifications */}
      {showEndedToast && (
        <>
          {isMobile ? (
            /* Premium Blocking Modal for Mobile */
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c3b28]/60 backdrop-blur-sm p-6 transition-all duration-300">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#288C49]/10 text-center animate-in fade-in zoom-in duration-200">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef7ec] text-[#288C49]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#0c3b28]">{toastTitle ?? 'Session Ended'}</h3>
                <p className="mt-2 text-sm text-[#4c6e4e] leading-relaxed">
                  {toastBody ?? 'The imam has ended the current live session.'}
                </p>
                <button
                  onClick={() => setShowEndedToast(false)}
                  className="mt-6 w-full rounded-xl bg-[#288C49] py-3 text-sm font-semibold text-white shadow-md shadow-[#288C49]/20 transition-all hover:bg-[#1a6632] active:scale-[0.98]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            /* Auto-Dismissing Bottom-Center Toast for Web/Desktop */
            <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center justify-between gap-4 rounded-xl bg-[#0c3b28] px-6 py-4 text-white shadow-2xl border border-[#288C49]/20 min-w-[320px] max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#288C49] text-white">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-serif font-medium text-sm tracking-wide text-emerald-50">
                  {toastBody ?? 'The sermon ended'}
                </span>
              </div>
              <button
                onClick={() => setShowEndedToast(false)}
                className="rounded-lg p-1 text-emerald-200/75 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Dismiss notification"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}