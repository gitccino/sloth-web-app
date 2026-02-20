import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

// icons
import { AlertCircleIcon, Ellipsis, Plus, X, Check } from 'lucide-react'

// Hono RPC
import { hc } from 'hono/client'
import { motion } from 'motion/react'
import { useHotkey } from '@tanstack/react-hotkeys'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Asterisk02Icon,
  Calendar03Icon,
  CircleArrowDown01Icon,
  Delete02Icon,
  FilterVerticalIcon,
  InboxIcon,
  Layers01Icon,
  RightToLeftListBulletIcon,
  Tag01Icon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons'
import type { AppType } from '../../../server/index.ts'

// shadcn/ui
import { Alert, AlertTitle } from '@/components/ui/alert'
import { authClient } from '@/lib/auth-client.ts'
import { Button } from '@/components/ui/button.tsx'
import { TodoComponent } from '@/components/todo.tsx'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  useCreateTodo,
  useDeleteTag,
  useDeleteTodo,
} from '@/utils/tanstack-query/useMutation.ts'

import { useIsMobile } from '@/hooks/use-mobile.ts'
import { cn } from '@/lib/utils.ts'

const client = hc<AppType>('/')

export const Route = createFileRoute('/todos')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const isMobile = useIsMobile()
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

  const [sidebarOpen, setSidebarOpen] = useState(false)

  useHotkey('Mod+B', () => {
    setSidebarOpen((prev) => !prev)
  })

  useEffect(() => {
    // console.log('/todos page useEffect')
    if (!session && !isPending) {
      router.navigate({ to: '/signin' })
    }
  }, [session, router, isPending])

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      className="text-core-background"
      style={
        {
          '--sidebar': isMobile
            ? 'var(--sloth-background)'
            : 'var(--sloth-aside-background)',
        } as React.CSSProperties
      }
    >
      <Sidebar collapsible="icon" className="border-0! bg-sloth-background">
        {!isMobile && (
          <SidebarHeader className="flex items-end p-1">
            <SidebarTrigger className="mr-1 size-6 text-core-muted-foreground hover:text-sloth-foreground hover:bg-sloth-aside-background-hover" />
          </SidebarHeader>
        )}

        <SidebarContent className="pt-10 md:pt-0 gap-2 overflow-x-hidden">
          <SidebarGroup className="p-0 px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Inbox"
                  className="h-7 font-semibold mx-2 md:mx-0"
                >
                  <Inbox color="#18AEF8" strokeWidth={2.5} />
                  <span>Inbox</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="p-0 px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Today"
                  className="h-7 font-semibold mx-2 md:mx-0"
                  onClick={isMobile ? () => setSidebarOpen(false) : () => null}
                >
                  <Star color="#FFD400" fill="#FFD400" />
                  <span>Today</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Upcoming"
                  className="h-7 font-semibold mx-2 md:mx-0"
                >
                  <CalendarDays color="#FA1855" />
                  <span>Upcoming</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Anytime"
                  className="h-7 font-semibold mx-2 md:mx-0"
                >
                  <Layers color="#39A99D" />
                  <span>Anytime</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* <SidebarSeparator className="bg-white/5" /> */}

          {/* <SidebarGroup className="p-0 px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Add new todo"
                  className="h-7 font-semibold mx-2 md:mx-0"
                  onClick={handleCreateNewTodo}
                >
                  <Plus />
                  <span>Add new todo</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup> */}

          <SidebarSeparator className="bg-white/5" />

          <SidebarGroup className="p-0 px-2">
            <SidebarMenu>
              {tags?.map((tag) => (
                <SidebarMenuItem
                  key={`tag-${tag.id}`}
                  className="flex items-center hover:bg-sloth-aside-background-hover rounded-md mx-2 md:mx-0"
                >
                  <SidebarMenuButton
                    variant="none"
                    tooltip={tag.name}
                    className="h-7 font-medium flex gap-3"
                  >
                    <div className="size-4 shrink-0 flex items-center justify-center">
                      <div
                        className="size-4 rounded-xs"
                        style={{ backgroundColor: tag.color || '#808080' }}
                      />
                    </div>
                    <span>{tag.name}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    className="hover:text-sloth-destructive text-muted-foreground md:text-sloth-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTagMutation.mutate({ id: tag.id })
                    }}
                  >
                    <X strokeWidth={2.5} className="size-3!" />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="px-2 mb-10">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Logout"
                className="h-7 font-semibold mx-2 md:mx-0"
                onClick={handleSignout}
              >
                <LogOut color="#e84b58" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {isEditingMode && isMobile && (
        <div className="z-30 fixed inset-0 bg-sloth-aside-background/60 w-screen h-screen pointer-events-none" />
      )}

      <main className="relative w-full flex flex-col md:flex-row md:items-start justify-start md:justify-center px-0 md:px-10 py-6 pb-100 md:pb-6 bg-sloth-background h-fit">
        <div className="w-full min-w-0 flex flex-col items-start gap-4">
          {isError && (
            <Alert>
              <AlertCircleIcon />
              <AlertTitle>{error.message}</AlertTitle>
            </Alert>
          )}

          <SidebarTrigger
            icon={ChevronLeft}
            className="md:hidden ml-1 h-fit w-fit p-1 text-core-muted-foreground hover:text-sloth-foreground hover:bg-sloth-aside-background-hover [&_svg:not([class*='size-'])]:size-8"
          />

          {/* <div className="ml-3 mb-6 md:mb-0 flex items-center gap-2">
            <Star color="#FFD400" fill="#FFD400" />
            <span className="text-2xl font-bold">Today</span>
          </div> */}

          <div className="w-full min-w-0 py-4 md:py-16 flex flex-col items-start gap-1 text-sm">
            <div className="ml-3 mb-6 flex items-center gap-2">
              <Star color="#FFD400" fill="#FFD400" />
              <span className="text-2xl font-bold">Today</span>
            </div>

            {data && (
              <div className="w-full min-w-0 flex flex-col gap-2">
                {data.map((todo) => (
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
                    className={cn(editingTodoId === todo.id && 'z-50')}
                  />
                ))}
              </div>
            )}

            {data && data.length === 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>No todos</span>
              </div>
            )}
          </div>
        </div>

        {/* Dock menu */}
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
          className="z-50 fixed left-1/2 -translate-x-1/2 bottom-6 md:bottom-10 px-2 py-1 rounded-full md:rounded-lg border-[0.5px] border-sloth-background-hover-2 flex items-center justify-center gap-0 bg-sloth-background-hover"
          data-ignore-click-outside
        >
          <Button
            variant="destructiveGhost"
            className="rounded-lg"
            onClick={() => editingTodoId && handleDeleteTodo(editingTodoId)}
          >
            {/* <Trash2 size={16} /> */}
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          </Button>
          <Button variant="none" className="rounded-lg">
            <Ellipsis size={16} />
          </Button>
        </motion.div>

        {/* Add New Todo Floating Button */}
        <motion.div
          initial="hidden"
          animate={isEditingMode ? 'hidden' : 'visible'}
          variants={{
            hidden: {
              y: 20,
              opacity: 0,
              scale: 0.9,
              pointerEvents: 'none' as const,
            },
            visible: {
              y: 0,
              opacity: 1,
              scale: 1,
              pointerEvents: 'auto' as const,
              transition: {
                type: 'spring',
                stiffness: 300,
                damping: 25,
              },
            },
          }}
          className="fixed md:hidden bottom-10 right-10 z-50"
        >
          <Button
            size="none"
            className="shadow-lg rounded-full p-2 flex items-center justify-center bg-[#18AEF8] hover:bg-[#17a0e0] text-white"
            onClick={handleCreateNewTodo}
            data-ignore-click-outside
          >
            <Plus className="size-6" />
          </Button>
        </motion.div>
      </main>
    </SidebarProvider>
  )
}
