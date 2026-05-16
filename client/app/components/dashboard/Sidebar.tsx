'use client'

import { useRouter } from 'next/navigation'
import { User } from '../../types'
import { authFetch } from '../../utils/auth'
import { cn } from '../../lib/utils'

interface SidebarProps {
  user: User
}

const imamNav = [
  {
    label: 'Dashboard',
    href: '/imam',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'New Session',
    href: '/imam/new-session',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
]

const listenerNav = [
  {
    label: 'Dashboard',
    href: '/listener',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Sidebar({ user }: SidebarProps) {
  const router = useRouter()
  const navItems = user.role === 'imam' ? imamNav : listenerNav

  const handleLogout = async () => {
    try {
      await authFetch('http://localhost:3001/api/auth/logout', { method: 'POST' }, false)
    } catch {}
    window.location.href = '/login'
  }

  return (
    <aside className="relative z-10 flex h-screen w-64 flex-shrink-0 flex-col bg-white/90 border-r border-[#dbeade] backdrop-blur-sm">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <p className="font-serif text-2xl font-bold tracking-[-0.04em] text-[#0c3b28]">
          Zermon
        </p>
        <p className="mt-1 text-xs font-medium text-[#4c6e4e]">
          {user.role === 'imam' ? 'Imam Portal' : 'Listener Portal'}
        </p>
      </div>

      <div className="mx-4 h-px bg-[#dbeade]" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            typeof window !== 'undefined' && window.location.pathname === item.href
          return (
            <button
              key={item.href}
              id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 text-left',
                isActive
                  ? 'bg-[#eef7ec] text-[#0c3b28] font-semibold'
                  : 'text-[#4c6e4e] hover:bg-[#f3faf4] hover:text-[#0c3b28]',
              )}
            >
              <span className={isActive ? 'text-[#288C49]' : 'text-[#6a9c6b]'}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mx-4 h-px bg-[#dbeade]" />

      {/* User + Logout */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#288C49] text-white text-sm font-semibold">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0c3b28]">{user.name}</p>
            <p className="truncate text-xs text-[#4c6e4e]">{user.email}</p>
          </div>
        </div>

        <button
          id="sidebar-logout"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#9b2c2c] hover:bg-[#fff1f1] transition-colors duration-150"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
