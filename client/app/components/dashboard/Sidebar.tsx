'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '../../types'
import { authFetch } from '../../utils/auth'
import { cn } from '../../lib/utils'

interface SidebarProps {
  user: User
}

const getNavItems = (role: string) => [
  {
    label: 'Live Sermons',
    href: role === 'imam' ? '/imam' : '/listener',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Stored Sermons',
    href: '/stored',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    label: 'Discuss your questions',
    href: '/discuss',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const navItems = getNavItems(user.role)

  const handleLogout = async () => {
    // Clear user cache instantly on logout
    const { setCachedUser } = require('../../utils/auth')
    setCachedUser(null)
    try {
      await authFetch('http://localhost:3001/api/auth/logout', { method: 'POST' }, false)
    } catch {}
    window.location.href = '/login'
  }

  const handleNavClick = (href: string) => {
    setIsOpen(false)
    router.push(href)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-[#288C49] shadow-sm border border-[#dbeade] transition-colors hover:bg-[#f3faf4] md:hidden"
        aria-label="Open navigation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        className={`fixed inset-0 z-20 bg-black/20 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`fixed inset-y-0 left-0 z-30 flex h-screen w-64 flex-shrink-0 flex-col bg-white/95 border-r border-[#dbeade] backdrop-blur-sm transform transition-transform duration-300 md:relative md:translate-x-0 md:flex ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-start justify-between px-6 pt-8 pb-6 md:items-center">
          <div>
            <p className="font-serif text-2xl font-bold tracking-[-0.04em] text-[#288C49]">
              Zermon
            </p>
            <p className="mt-1 text-xs font-medium text-[#4c6e4e]">
              {user.role === 'imam' ? 'Imam Portal' : 'Listener Portal'}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3faf4] text-[#288C49] transition-colors hover:bg-[#e6f3ea] md:hidden"
            aria-label="Close navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mx-4 h-px bg-[#dbeade]" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              typeof window !== 'undefined' && window.location.pathname === item.href
            return (
              <button
                key={item.href}
                id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                onClick={() => handleNavClick(item.href)}
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
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#288C49] text-white text-sm font-serif font-semibold">
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
    </>
  )
}
