import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'block w-full rounded-[0.5rem] border border-[#0c3b28]/20 bg-white/90 px-4 py-3 text-sm text-brandDark shadow-sm transition duration-150 placeholder:text-brandDark/40 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input }
