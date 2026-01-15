import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

// icons
import { AlertCircleIcon } from 'lucide-react'

// Hono RPC
import { hc } from 'hono/client'
import { useEffect } from 'react'
import type { AppType } from '../../../server/index.ts'

// shadcn/ui
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { authClient } from '@/lib/auth-client.ts'

const client = hc<AppType>('/')

export const Route = createFileRoute('/todos')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const { data, isError, error, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await client.api.todos.$get()
      if (!res.ok) throw new Error('failed to fetch todos')
      return res.json()
    },
  })

  useEffect(() => {
    if (!session && !isPending) {
      router.navigate({ to: '/signin' })
    }
  }, [session, router, isPending])

  return (
    <div className="flex items-start justify-center min-h-dvh mt-10 pt-30">
      <div className="flex flex-col gap-4">
        {isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-lg" />
                <Skeleton className="h-5 w-40 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <Alert>
            <AlertCircleIcon />
            <AlertTitle>{error.message}</AlertTitle>
          </Alert>
        )}

        <div className="flex flex-col gap-0.5">
          {data &&
            data.map((todo) => (
              <div key={todo.id} className="flex items-center gap-2">
                <Checkbox />
                <span>{todo.title}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
