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
    <main className="min-h-screen bg-[#eef7ec] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center gap-8">
        <div className="w-full max-w-2xl text-center">
          <span className="inline-flex rounded-full bg-[#f3fbf5] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#2d6a33] shadow-sm">
            Welcome to Zermon
          </span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[#173925] sm:text-4xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#2f4f34] sm:text-base">
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
