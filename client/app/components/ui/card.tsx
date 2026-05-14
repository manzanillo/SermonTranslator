import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[2rem] border border-[#dbeade] bg-white/95 p-8 shadow-[0_24px_80px_rgba(17,45,22,0.12)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
