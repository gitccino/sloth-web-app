import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="mt-10 flex items-start justify-center min-h-dvh">
      Hello "/signup"!
    </div>
  )
}
