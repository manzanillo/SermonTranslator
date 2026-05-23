'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../components/dashboard/AppShell'
import LiveSermons from '../components/dashboard/LiveSermons'
import { authFetch, getCachedUser, setCachedUser } from '../utils/auth'
import { User } from '../types'

export default function ImamPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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
          if (data.user.role === 'imam') {
            setUser(data.user)
            setCachedUser(data.user)
          } else {
            router.push('/listener')
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
    </AppShell>
  )
}