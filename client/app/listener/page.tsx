'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ListenerView from '../components/ListenerView'
import { authFetch } from '../utils/auth'

export default function ListenerPage() {
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
            // User is imam, redirect to imam view
            router.push('/imam')
          }
        } else {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuthorization()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect
  }

  return <ListenerView />
}