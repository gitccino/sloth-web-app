import { cn } from '@/lib/utils'

type WarningMessageProps = {
  name: string
  message: string
}

export function WarningMessage({
  name,
  message,
  className,
}: React.ComponentProps<'span'> & WarningMessageProps) {
  return (
    <span
      id={`${name}-validation-status`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`${name} validation status`}
      className={cn(
        `text-xs text-core-destructive font-semibold ${message === '' ? 'hidden' : 'visible'}`,
        className,
      )}
    >
      {message}
    </span>
  )
}
