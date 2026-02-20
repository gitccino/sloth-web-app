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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InputWithIcon } from '@/components/ui/inputwithicon'
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
  const [isOptionMenuOpen, setIsOptionMenuOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])
  const [tagSearch, setTagSearch] = useState('')
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

  const handleToggleFilterTag = (tagId: string) => {
    setFilterTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    )
  }

  const filteredTags =
    tags?.filter((tag) =>
      tag.name.toLowerCase().includes(tagSearch.toLowerCase()),
    ) || []

  const displayData = data?.filter((todo) => {
    if (filterTagIds.length === 0) return true
    return todo.tags.some((t) => filterTagIds.includes(t.id))
  })

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
      <Sidebar
        collapsible="icon"
        className="border-0! bg-sloth-background select-none"
      >
        {!isMobile && (
          <SidebarHeader className="flex items-end p-1">
            <SidebarTrigger className="size-6 mr-1 text-core-muted-foreground hover:text-sloth-foreground hover:bg-sloth-aside-background-hover" />
          </SidebarHeader>
        )}

        <SidebarContent className="pt-6 md:pt-0 gap-2 overflow-x-hidden">
          <SidebarGroup className="sloth-sidebar-group">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Inbox"
                  className="sloth-sidebar-menu-button"
                >
                  <HugeiconsIcon
                    icon={InboxIcon}
                    color="#18AEF8"
                    strokeWidth={2.5}
                  />
                  <span>Inbox</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="sloth-sidebar-group">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Today"
                  className="group sloth-sidebar-menu-button"
                  onClick={isMobile ? () => setSidebarOpen(false) : () => null}
                >
                  <HugeiconsIcon
                    icon={Asterisk02Icon}
                    color="#FFD400"
                    strokeWidth={2.5}
                    className="group-disabled:grayscale"
                  />
                  <span>Today</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Upcoming"
                  className="group sloth-sidebar-menu-button"
                  disabled
                >
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    color="#FA1855"
                    strokeWidth={2.2}
                    className="group-disabled:grayscale"
                  />
                  <span>Upcoming</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Anytime"
                  className="group sloth-sidebar-menu-button"
                  disabled
                >
                  <HugeiconsIcon
                    icon={Layers01Icon}
                    color="#39A99D"
                    strokeWidth={2.5}
                    className="group-disabled:grayscale"
                  />
                  <span>Anytime</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator className="bg-sloth-foreground/5" />

          <SidebarGroup className="sloth-sidebar-group">
            <SidebarMenu>
              {tags?.map((tag) => (
                <SidebarMenuItem
                  key={`tag-${tag.id}`}
                  className="hover:bg-sloth-aside-background-hover rounded-md md:mx-0"
                >
                  <SidebarMenuButton
                    variant="none"
                    tooltip={tag.name}
                    className="sloth-sidebar-menu-button"
                  >
                    <div className="size-5 flex items-center justify-center">
                      <div
                        className="size-4 rounded"
                        style={{ backgroundColor: tag.color || '#808080' }}
                      />
                    </div>
                    {/* <div
                      className="size-4 rounded"
                      style={{ backgroundColor: tag.color || '#808080' }}
                    ></div> */}
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

        <SidebarFooter className="mb-2 md:mb-4 p-0">
          <SidebarGroup className="sloth-sidebar-group gap-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Logout"
                  className="sloth-sidebar-menu-button"
                  onClick={handleSignout}
                >
                  {/* <LogOut color="#e84b58" /> */}
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    color="#d1c58b"
                    strokeWidth={2}
                  />
                  <span className="capitalize">
                    {session?.user.email.split('@')[0]}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {/* <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Logout"
                  className="sloth-sidebar-menu-button"
                  onClick={handleSignout}
                >
                  <LogOut color="#e84b58" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu> */}
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>

      {(isEditingMode || isOptionMenuOpen) && isMobile && (
        <div
          className="z-30 fixed inset-0 bg-sloth-aside-background/60 w-screen h-screen"
          onClick={(e) => {
            e.stopPropagation()
          }}
        />
      )}

      <main className="relative w-full flex flex-col md:flex-row md:items-start justify-start md:justify-center px-0 md:px-10 py-6 pb-100 md:pb-6 bg-sloth-background h-fit">
        <div className="w-full min-w-0 flex flex-col items-start gap-4">
          {isError && (
            <Alert>
              <AlertCircleIcon />
              <AlertTitle>{error.message}</AlertTitle>
            </Alert>
          )}
          <div className="md:hidden w-full pl-2.5 pr-4 flex items-end justify-between">
            <SidebarTrigger
              isMobile
              className="h-fit w-fit p-1 text-muted-foreground [&_svg:not([class*='size-'])]:size-6"
            />
            <DropdownMenu
              open={isOptionMenuOpen}
              onOpenChange={setIsOptionMenuOpen}
            >
              <DropdownMenuTrigger className="outline-none">
                <HugeiconsIcon
                  icon={CircleArrowDown01Icon}
                  className={`text-muted-foreground transition-transform duration-300 will-change-transform ${isOptionMenuOpen ? 'rotate-180' : ''}`}
                  strokeWidth={2.2}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 p-2 bg-sloth-background-hover text-sloth-foreground rounded-2xl"
              >
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-base"
                  onSelect={(e) => {
                    e.preventDefault()
                    setIsFilterDialogOpen(true)
                    setIsOptionMenuOpen(false)
                  }}
                >
                  {/* <Tag className="size-4" /> */}
                  <HugeiconsIcon
                    icon={Tag01Icon}
                    className="size-4.5 text-[#18AEF8]"
                    strokeWidth={2}
                  />
                  <span>Filter by Tags</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2 text-base">
                  {/* <CheckSquare className="size-4" /> */}
                  <HugeiconsIcon
                    icon={RightToLeftListBulletIcon}
                    className="size-4.5 text-[#18AEF8]"
                    strokeWidth={2}
                  />
                  <span>Select</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter by Tags Dialog */}
            <Dialog
              open={isFilterDialogOpen}
              onOpenChange={setIsFilterDialogOpen}
            >
              <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="w-[80%] max-w-sm border-0 bg-sloth-aside-background text-sloth-foreground p-4 pb-6 gap-4 max-h-[85vh] overflow-y-auto rounded-3xl"
              >
                <DialogHeader>
                  <DialogTitle>Filter by Tags</DialogTitle>
                </DialogHeader>
                <div className="relative w-full max-w-sm mx-auto flex flex-col gap-2">
                  <InputWithIcon
                    id="filter-tag-search"
                    name="filter-tag-search"
                    type="text"
                    autoComplete="off"
                    placeholder="Search tag"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    className="w-full md:my-0.5 pl-3 h-8.5 md:h-8 text-base md:text-sm rounded-md ring-0 focus-visible:ring-0 border-0 focus:bg-sloth-aside-background-hover bg-sloth-background"
                  />
                  <div className="relative flex flex-col justify-center items-center">
                    <div className="w-full flex flex-col gap-0.5 max-h-52 pb-4 overflow-y-auto">
                      {filteredTags.length > 0
                        ? filteredTags.map((tag) => {
                            const isTagAdded = filterTagIds.includes(tag.id)
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                className="flex items-center gap-2 cursor-pointer h-fit py-1 md:py-1 px-2 rounded-md hover:bg-sloth-background hover:text-core-background text-left w-full"
                                onClick={() => handleToggleFilterTag(tag.id)}
                              >
                                <span
                                  className="size-4 md:size-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: tag.color || '#808080',
                                  }}
                                />
                                <span className="flex-1">{tag.name}</span>
                                {isTagAdded && (
                                  <Check
                                    className="size-4 md:size-3 shrink-0"
                                    strokeWidth={3}
                                  />
                                )}
                              </button>
                            )
                          })
                        : null}
                      {!tagSearch.trim() && tags?.length === 0 && (
                        <div className="py-2 px-2 text-muted-foreground text-sm">
                          No tags available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="w-full min-w-0 py-4 md:py-16 flex flex-col items-start gap-1 text-sm">
            <div className="ml-3 mb-6 flex items-center gap-2">
              {/* <Star color="#FFD400" fill="#FFD400" /> */}
              <HugeiconsIcon
                icon={Asterisk02Icon}
                color="#FFD400"
                strokeWidth={2.5}
                className="size-6"
              />
              <span className="text-2xl font-semibold">Today</span>
            </div>

            <div className="w-full px-4 flex justify-start items-center gap-2 mb-2">
              {/* <span className="text-sm font-semibold">Filters:</span> */}
              {filterTagIds.length > 0 && (
                <HugeiconsIcon
                  icon={FilterVerticalIcon}
                  className="text-muted-foreground"
                />
              )}
              {filterTagIds.map((tagId) => {
                const tagObj = tags?.find((t) => t.id === tagId)
                if (!tagObj) return null
                return (
                  <div
                    key={tagObj.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold cursor-default"
                    style={{
                      backgroundColor: tagObj.color
                        ? `${tagObj.color}90`
                        : '#80808090',
                    }}
                  >
                    <span>{tagObj.name}</span>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center size-3 rounded-full hover:bg-sloth-background/20"
                      onClick={() => handleToggleFilterTag(tagObj.id)}
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  </div>
                )
              })}
            </div>

            {displayData && (
              <div className="w-full min-w-0 flex flex-col gap-2">
                {displayData.map((todo) => (
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

            {displayData && displayData.length === 0 && (
              <div className="px-4 flex items-center gap-2 text-muted-foreground">
                <span>Don't be too lazy, do something!</span>
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
          className="fixed bottom-10 right-10 z-50"
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
