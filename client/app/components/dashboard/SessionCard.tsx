'use client'

import { Session, User } from '../../types'
import { useRouter } from 'next/navigation'

interface SessionCardProps {
  session: Session
  currentUser: User
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just started'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function SessionCard({ session, currentUser }: SessionCardProps) {
  const router = useRouter()
  const isOwnSession = session.imamId === currentUser.id
  const isImam = currentUser.role === 'imam'

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#dbeade] bg-white/95 px-6 py-5 shadow-[0_4px_24px_rgba(17,45,22,0.07)] transition-shadow hover:shadow-[0_8px_32px_rgba(17,45,22,0.11)]">
      {/* Left — status + info */}
      <div className="flex items-start gap-4 min-w-0">
        {/* Live pulse */}
        <div className="mt-1 flex-shrink-0">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#288C49] opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#288C49]" />
          </span>
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#0c3b28] font-serif">{session.title}</p>
          <p className="mt-0.5 text-sm text-[#4c6e4e]">
            {isOwnSession ? 'Your session' : `by ${session.imam.name}`}
            {' · '}
            {timeAgo(session.createdAt)}
          </p>
        </div>
      </div>

      {/* Right — listeners + action */}
      <div className="flex flex-shrink-0 items-center gap-4">
        {/* Listener count */}
        <div className="flex items-center gap-1.5 rounded-full bg-[#eef7ec] px-3 py-1">
          <svg width="13" height="13" fill="none" stroke="#288C49" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-semibold text-[#288C49]">{session.participants.length}</span>
        </div>

        {/* Action button */}
        {isImam ? (
          isOwnSession ? (
            <button
              id={`manage-session-${session.id}`}
              onClick={() => router.push('/imam/session')}
              className="rounded-xl bg-[#288C49] px-4 py-2 text-sm font-semibold text-white hover:bg-[#149121] transition-colors duration-150"
            >
              Manage
            </button>
          ) : (
            <span className="rounded-xl border border-[#dbeade] px-4 py-2 text-sm font-medium text-[#4c6e4e]">
              Live
            </span>
          )
        ) : (
          <button
            id={`join-session-${session.id}`}
            onClick={() => router.push('/listener/session')}
            className="rounded-xl bg-[#288C49] px-4 py-2 text-sm font-semibold text-white hover:bg-[#149121] transition-colors duration-150"
          >
            Join
          </button>
        )}
      </div>
    </div>
  )
}
