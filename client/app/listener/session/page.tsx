'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ListenerView from '../../components/ListenerView'
import { authFetch } from '../../utils/auth'

export default function ListenerSessionPage() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const response = await authFetch('http://localhost:3001/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user.role === 'listener') {
            setIsAuthorized(true)
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef7ec]">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#288C49] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthorized) return null

  return <ListenerView />
}
