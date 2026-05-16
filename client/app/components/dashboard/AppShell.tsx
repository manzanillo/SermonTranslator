import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import { User } from '../../types'

interface AppShellProps {
  user: User
  children: ReactNode
}

export default function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#eef7ec]">
      {/* Decorative background — mirrors AuthPageShell */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(24,191,35,0.13),_transparent_55%)]" />
      <div className="pointer-events-none absolute -right-24 -top-16 h-[34rem] w-[34rem] rounded-full bg-[#d9f5dd]/50 blur-[140px]" />

      <Sidebar user={user} />

      <main className="relative flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
