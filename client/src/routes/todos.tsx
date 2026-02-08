import { useEffect, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

// icons
import { AlertCircleIcon, Ellipsis, Trash2 } from 'lucide-react'

// Hono RPC
import { hc } from 'hono/client'
import { motion } from 'motion/react'
import type { AppType } from '../../../server/index.ts'

// shadcn/ui
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { authClient } from '@/lib/auth-client.ts'
import { Button } from '@/components/ui/button.tsx'
import { TodoComponent } from '@/components/todo.tsx'

import { cn } from '@/lib/utils.ts'
import {
  useCreateTodo,
  useDeleteTodo,
} from '@/utils/tanstack-query/useMutation.ts'

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
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [isEditingMode, setIsEditingMode] = useState(false)
  const createTodoMutation = useCreateTodo()
  const deleteTodoMutation = useDeleteTodo()

  const handleEditStart = (id: string) => {
    setEditingTodoId(id)
    setIsEditingMode(true)
  }
  const handleEditEnd = () => {
    setEditingTodoId(null)
    setIsEditingMode(false)
  }

  const handleCreateNewTodo = async () => {
    await createTodoMutation.mutateAsync({ title: 'New todo' })
  }

  const handleDeleteTodo = async () => {
    if (!editingTodoId) return
    await deleteTodoMutation.mutateAsync({ id: editingTodoId })
    handleEditEnd()
  }

  useEffect(() => {
    if (!session && !isPending) {
      router.navigate({ to: '/signin' })
    }
  }, [session, router, isPending])

  return (
    <div className="relative z-10 flex items-start justify-center min-h-[calc(100vh-120px)] pt-30">
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

        <div className="flex flex-col items-center gap-0.5">
          {data &&
            data.map((todo) => (
              <TodoComponent
                key={todo.id}
                id={todo.id}
                title={todo.title}
                completed={todo.completed}
                onEditStart={handleEditStart}
                onEditEnd={handleEditEnd}
                handleDeleteTodo={handleDeleteTodo}
              />
            ))}

          {data && data.length === 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>No todos</span>
            </div>
          )}

          <motion.div className={cn(data && data.length > 0 ? 'mt-4' : '')}>
            <Button
              variant="linkAnimated"
              onClick={handleCreateNewTodo}
              className="font-semibold"
            >
              Add new todo
            </Button>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate={isEditingMode ? 'visible' : 'hidden'}
        variants={{
          hidden: {
            y: 20,
            opacity: 0,
            scale: 0.9,
          },
          visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 25,
            },
          },
        }}
        className="fixed bottom-10 px-2 py-1 rounded-2xl flex items-center justify-center gap-0 bg-core-card"
        data-ignore-click-outside
      >
        <Button
          variant="destructiveGhost"
          className="rounded-xl"
          onClick={handleDeleteTodo}
        >
          <Trash2 size={16} />
        </Button>
        <Button variant="ghost" className="rounded-xl hover:bg-black/10">
          <Ellipsis size={16} />
        </Button>
      </motion.div>
    </div>
  )
}
