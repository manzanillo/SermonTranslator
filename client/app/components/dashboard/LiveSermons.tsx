'use client'

import { useRouter } from 'next/navigation'
import { User } from '../../types'
import SessionsList from './SessionsList'

interface LiveSermonsProps {
  user: User
}

function getGreeting(name: string) {
  const h = new Date().getHours()
  const period = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${period}, ${name.split(' ')[0]}`
}

export default function LiveSermons({ user }: LiveSermonsProps) {
  const router = useRouter()
  const isImam = user.role === 'imam'

  return (
    <div className="flex flex-col pt-12 pb-28 px-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl font-bold tracking-[-0.03em] text-[#0c3b28]">
          {getGreeting(user.name)}
        </h1>
        <p className="mt-2 text-base text-[#4c6e4e]">
          {isImam
            ? 'Manage your sermon sessions and translations in real time.'
            : 'Join a live sermon session and follow along with real-time translations.'}
        </p>
      </div>

        {/* Start New Session CTA (Imam Only) */}
        {isImam && (
          <>
            <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#dbeade] bg-white/95 p-6 shadow-[0_4px_24px_rgba(17,45,22,0.07)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-serif text-xl font-semibold text-[#0c3b28]">Ready to begin?</p>
                <p className="mt-1 text-sm text-[#4c6e4e]">
                  Start a new live session and your listeners will be notified.
                </p>
              </div>
              <button
                id="start-new-session-btn"
                onClick={() => router.push('/imam/new-session')}
                className="hidden sm:inline-flex flex-shrink-0 rounded-xl bg-[#288C49] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#149121] transition-colors duration-150"
              >
                + New Session
              </button>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 bg-[#F4F8F5]/95 backdrop-blur-sm px-4 py-4 sm:hidden">
              <div className="mx-auto max-w-4xl flex justify-center">
                <button
                  id="start-new-session-btn-mobile"
                  onClick={() => router.push('/imam/new-session')}
                  className="w-full max-w-md rounded-xl bg-[#288C49] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#149121] transition-colors duration-150"
                >
                  + New Session
                </button>
              </div>
            </div>
          </>
        )}

        {/* Info banner (Listener Only) */}
        {!isImam && (
          <div className="mb-8 flex items-center gap-4 rounded-2xl border border-[#dbeade] bg-white/95 p-5 shadow-[0_4px_24px_rgba(17,45,22,0.07)]">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#eef7ec]">
              <svg width="18" height="18" fill="none" stroke="#288C49" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0c3b28]">Live sessions update in real time</p>
              <p className="mt-0.5 text-sm text-[#4c6e4e]">
                Sessions appear automatically. Click <strong>Join</strong> to listen with translations.
              </p>
            </div>
          </div>
        )}

        {/* Live Sessions */}
        <div className="w-full mx-auto">
          <div className="mb-4 flex items-center gap-3 justify-center">
            <h2 className="font-serif text-2xl font-semibold text-[#0c3b28]">Live Sessions</h2>
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
