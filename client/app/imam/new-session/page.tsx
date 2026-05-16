'use client'

import { useRouter } from 'next/navigation'

export default function NewSessionPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef7ec]">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(24,191,35,0.13),_transparent_55%)]" />
      <div className="pointer-events-none absolute -right-24 -top-16 h-[34rem] w-[34rem] rounded-full bg-[#d9f5dd]/50 blur-[140px]" />

      <div className="relative text-center max-w-md px-4">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#eef7ec] border border-[#dbeade] shadow-[0_4px_24px_rgba(17,45,22,0.07)]">
          <svg width="28" height="28" fill="none" stroke="#288C49" strokeWidth="1.6" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>

        <h1 className="font-serif text-4xl font-black tracking-[-0.03em] text-[#0c3b28]">
          New Session
        </h1>
        <p className="mt-3 text-base text-[#4c6e4e] leading-relaxed">
          The session creation flow is coming soon. Check back later.
        </p>

        <button
          id="new-session-back-btn"
          onClick={() => router.push('/imam')}
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#dbeade] bg-white/95 px-6 py-3 text-sm font-semibold text-[#0c3b28] shadow-sm hover:bg-[#f3faf4] transition-colors duration-150"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
