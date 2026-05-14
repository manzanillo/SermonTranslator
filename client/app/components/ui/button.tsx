import { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[#316a3f] text-white hover:bg-[#21502d] focus-visible:ring-[#2c6840] shadow-sm',
  secondary:
    'bg-white text-[#1f472b] border border-[#c6e2cd] hover:bg-[#f1f7f2] focus-visible:ring-[#a6c8b0]',
  ghost:
    'bg-transparent text-[#1f472b] hover:bg-[#eff7ef] focus-visible:ring-[#a6c8b0]',
}

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
