import { useCallback, useEffect, useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

// icons
import {
  AlertCircleIcon,
  CalendarDays,
  Ellipsis,
  Home,
  Inbox,
  Layers,
  LogOut,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react'

// Hono RPC
import { hc } from 'hono/client'
import { motion } from 'motion/react'
import type { AppType } from '../../../server/index.ts'

// shadcn/ui
// import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { authClient } from '@/lib/auth-client.ts'
import { Button } from '@/components/ui/button.tsx'
import { TodoComponent } from '@/components/todo.tsx'

// import { useNavStore } from '@/lib/store.ts'

// import { cn } from '@/lib/utils.ts'
import {
  useCreateTodo,
  useDeleteTag,
  useDeleteTodo,
} from '@/utils/tanstack-query/useMutation.ts'

const client = hc<AppType>('/')

export const Route = createFileRoute('/todos')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const { data, isError, error } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await client.api.todos.$get()
      if (!res.ok) throw new Error('failed to fetch todos')
      return res.json()
    },
  })

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await client.api.tags.$get()
      if (!res.ok) throw new Error('failed to fetch tags')
      return res.json()
    },
  })

  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [isEditingMode, setIsEditingMode] = useState(false)
  const createTodoMutation = useCreateTodo()
  const deleteTodoMutation = useDeleteTodo()
  const deleteTagMutation = useDeleteTag()

  // const hideDisplay = useNavStore((state) => state.hideDisplay)

  const handleEditStart = useCallback((id: string) => {
    setEditingTodoId(id)
    setIsEditingMode(true)
  }, [])

  const handleEditEnd = useCallback(() => {
    setEditingTodoId(null)
    setIsEditingMode(false)
  }, [])

  const handleCreateNewTodo = async () => {
    const newTodo = await createTodoMutation.mutateAsync({ title: 'New todo' })
    handleEditStart(newTodo.data.id)
  }

  const handleDeleteTodo = useCallback(
    async (id: string) => {
      await deleteTodoMutation.mutateAsync({ id })
      setEditingTodoId(null)
      setIsEditingMode(false)
    },
    [deleteTodoMutation],
  )

  const handleSignout = async () => {
    try {
      await authClient.signOut()
      router.navigate({ to: '/' })
    } catch (err) {
      console.error('Signout failed', err)
    }
  }

  // useEffect(() => {
  //   hideDisplay()
  // }, [hideDisplay])

  useEffect(() => {
    // console.log('/todos page useEffect')
    if (!session && !isPending) {
      router.navigate({ to: '/signin' })
    }
  }, [session, router, isPending])

  return (
    <div className="relative flex justify-start min-h-[calc(100dvh-80px)] pt-0 text-core-background">
      <div className="w-65 px-2 py-4 bg-sloth-aside-background ml-4 mb-4 flex flex-col items-start gap-4 rounded-lg">
        <Button
          variant="none"
          size="sm"
          className="h-fit py-1 w-full font-medium gap-1.5 flex justify-start"
        >
          <Inbox size={12} color="#18AEF8" />
          <span>Inbox</span>
        </Button>

        <div className="w-full flex flex-col items-start gap-0">
          <Button
            variant="none"
            size="sm"
            className="h-fit py-1 w-full font-medium gap-1.5 flex justify-start"
          >
            <Star size={12} color="#FFD400" fill="#FFD400" />
            <span>Today</span>
          </Button>

          <Button
            variant="none"
            size="sm"
            className="h-fit py-1 w-full font-medium gap-1.5 flex justify-start"
          >
            <CalendarDays size={12} color="#FA1855" />
            <span>Upcoming</span>
          </Button>

          <Button
            variant="none"
            size="sm"
            className="h-fit py-1 w-full font-medium gap-1.5 flex justify-start"
          >
            <Layers size={12} color="#39A99D" />
            <span>Anytime</span>
          </Button>
        </div>

        <div className="w-[90%] self-center border-white/5 border-[0.5px]" />

        <div className="w-full flex flex-col items-start gap-0">
          <Button
            variant="none"
            size="sm"
            className="h-fit py-1 w-full font-medium gap-1.5 flex justify-start"
            onClick={handleCreateNewTodo}
          >
            <Plus size={12} />
            <span>Add new todo</span>
          </Button>
        </div>

        <div className="w-[90%] self-center border-white/5 border-[0.5px]" />

        <div className="w-full">
          {tags &&
            tags.map((tag) => (
              <Button
                key={`tag-${tag.id}`}
                variant="none"
                size="sm"
                className="group/tag h-fit py-1 w-full font-medium gap-1.5 flex justify-start items-center"
              >
                <div
                  className="w-3 h-3 shrink-0"
                  style={{ backgroundColor: tag.color || '#808080' }}
                ></div>
                <span className="flex-1 text-left truncate">{tag.name}</span>
                <span
                  className="invisible group-hover/tag:visible shrink-0 p-0.5 rounded hover:text-sloth-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteTagMutation.mutate({ id: tag.id })
                  }}
                >
                  <X strokeWidth={2.5} className="size-3" />
                </span>
              </Button>
            ))}
        </div>

        <div className="w-full mt-auto flex flex-col gap-0">
          {/* <Button
            variant="none"
            size="sm"
            className="h-fit py-1 w-full font-medium gap-1.5 flex justify-start"
            asChild
          >
            <Link to="/">
              <Home size={12} color="#18AEF8" />
              <span>Home</span>
            </Link>
          </Button> */}

          <Button
            variant="none"
            size="sm"
            className="h-fit py-1 w-full font-medium gap-1.5 flex justify-start"
            onClick={handleSignout}
          >
            <LogOut size={12} color="#e84b58" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      <div className="relative w-full flex items-start justify-center px-10 py-6 bg-[#262528]">
        <div className="w-full flex flex-col items-start gap-4">
          {/* {isLoading && (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-lg" />
                  <Skeleton className="h-5 w-40 rounded-lg" />
                </div>
              ))}
            </div>
          )} */}

          {isError && (
            <Alert>
              <AlertCircleIcon />
              <AlertTitle>{error.message}</AlertTitle>
            </Alert>
          )}

          <div className="w-full flex flex-col items-start gap-1 text-sm">
            {data &&
              data.map((todo) => (
                <TodoComponent
                  key={todo.id}
                  id={todo.id}
                  title={todo.title}
                  description={todo.description}
                  completed={todo.completed}
                  initialEditing={editingTodoId === todo.id}
                  onEditStart={handleEditStart}
                  onEditEnd={handleEditEnd}
                  handleDeleteTodo={handleDeleteTodo}
                  startAt={todo.startAt}
                  dueAt={todo.dueAt}
                  tags={tags}
                  todoTags={todo.tags}
                />
              ))}

            {data && data.length === 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>No todos</span>
              </div>
            )}

            {/* <motion.div className={cn(data && data.length > 0 ? 'mt-4' : '')}>
              <Button
                variant="linkAnimated"
                onClick={handleCreateNewTodo}
                className="font-semibold opacity-10"
              >
                Add new todo
              </Button>
            </motion.div> */}
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
          className="fixed bottom-10 px-2 py-1 rounded-lg flex items-center justify-center gap-0 bg-[#343338]"
          data-ignore-click-outside
        >
          <Button
            variant="destructiveGhost"
            className="rounded-lg"
            onClick={() => editingTodoId && handleDeleteTodo(editingTodoId)}
          >
            <Trash2 size={16} />
          </Button>
          <Button variant="none" className="rounded-lg">
            <Ellipsis size={16} className="" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
