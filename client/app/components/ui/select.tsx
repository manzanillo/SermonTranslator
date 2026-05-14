import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'block w-full rounded-[0.5rem] border border-[#0c3b28]/20 bg-white/90 px-4 py-3 text-sm text-brandDark shadow-sm transition duration-150 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    )
  },
)

Select.displayName = 'Select'

export { Select }
