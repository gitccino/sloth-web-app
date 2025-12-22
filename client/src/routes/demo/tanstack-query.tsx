import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

// Hono RPC
import { hc } from 'hono/client'
import type { AppType } from '../../../../server/index.ts'

const client = hc<AppType>('/')

export const Route = createFileRoute('/demo/tanstack-query')({
  component: TanStackQueryDemo,
})

function TanStackQueryDemo() {
  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await client.api.people.$get()
      if (!res.ok) throw new Error('failed to fetch people')
      return res.json()
    },
    initialData: [],
  })

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-2xl p-8">
        <h1 className="mb-4">TanStack Query Simple Promise Handling</h1>
        <ul className="mb-4 space-y-2">
          {data.map((todo) => (
            <li key={todo.id}>
              <span>- {todo.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
