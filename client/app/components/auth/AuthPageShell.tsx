import { ReactNode } from 'react'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'

interface AuthPageShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footnote?: ReactNode
}

export function AuthPageShell({ title, subtitle, children, footnote }: AuthPageShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef7ec] px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top,_rgba(24,191,35,0.18),_transparent_50%)]" />
      <div className="pointer-events-none absolute -right-20 -top-10 h-[30rem] w-[30rem] rounded-full bg-[#d9f5dd]/60 blur-[120px]" />

      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center gap-8">
        <div className="w-full max-w-2xl text-center">
          <p className="text-sm font-semibold font-serif tracking-[-0.06em] text-brand">
            Zermon
          </p>
          <h1 className="mt-6 text-6xl font-black tracking-[-0.04em] text-[#0c3b28] sm:text-7xl">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-[#2f4f34] sm:text-lg">
            {subtitle}
          </p>
        </div>

        <Card className="w-full max-w-xl">
          {children}
        </Card>

        {footnote ? (
          <div className={cn('max-w-xl text-center text-sm text-[#425644]')}>{footnote}</div>
        ) : null}
      </div>
    </main>
  )
}
