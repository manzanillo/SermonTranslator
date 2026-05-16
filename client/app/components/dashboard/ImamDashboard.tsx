'use client'

import { useRouter } from 'next/navigation'
import { User } from '../../types'
import SessionsList from './SessionsList'

interface ImamDashboardProps {
  user: User
}

function getGreeting(name: string) {
  const h = new Date().getHours()
  const period = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${period}, ${name.split(' ')[0]}`
}

export default function ImamDashboard({ user }: ImamDashboardProps) {
  const router = useRouter()

  return (
    <div className="px-8 py-10 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-black tracking-[-0.03em] text-[#0c3b28]">
          {getGreeting(user.name)}
        </h1>
        <p className="mt-2 text-base text-[#4c6e4e]">
          Manage your sermon sessions and translations in real time.
        </p>
      </div>

      {/* Start New Session CTA */}
      <div className="mb-8 flex items-center justify-between rounded-2xl border border-[#dbeade] bg-white/95 p-6 shadow-[0_4px_24px_rgba(17,45,22,0.07)]">
        <div>
          <p className="font-serif text-xl font-semibold text-[#0c3b28]">Ready to begin?</p>
          <p className="mt-1 text-sm text-[#4c6e4e]">
            Start a new live session and your listeners will be notified.
          </p>
        </div>
        <button
          id="start-new-session-btn"
          onClick={() => router.push('/imam/new-session')}
          className="flex-shrink-0 rounded-xl bg-[#288C49] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#149121] transition-colors duration-150"
        >
          + New Session
        </button>
      </div>

      {/* Live Sessions */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-serif text-2xl font-semibold text-[#0c3b28]">Live Now</h2>
          <span className="flex items-center gap-1.5 rounded-full bg-[#eef7ec] px-3 py-0.5">
            <span className="h-2 w-2 rounded-full bg-[#288C49] animate-pulse" />
            <span className="text-xs font-semibold text-[#288C49]">Live</span>
          </span>
        </div>
        <SessionsList currentUser={user} />
      </div>
    </div>
  )
}
