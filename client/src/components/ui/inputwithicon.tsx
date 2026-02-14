import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: LucideIcon
  endIcon?: LucideIcon
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, type, startIcon, endIcon, ...props }) => {
    const StartIcon = startIcon
    const EndIcon = endIcon
    return (
      <div className="relative">
        {StartIcon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <StartIcon size={12} className="text-muted-foreground" />
          </div>
        )}
        <Input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md py-2 px-4 text-sloth-foreground border-core-border/20 ring-0 focus-visible:ring-0',
            startIcon ? 'pl-10' : '',
            endIcon ? 'pr-10' : '',
            className,
          )}
          {...props}
        />
        {EndIcon && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <EndIcon size={12} className="text-muted-foreground" />
          </div>
        )}
      </div>
    )
  },
)

export { InputWithIcon }
