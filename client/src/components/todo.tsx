import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  CalendarDays,
  Check,
  Flag,
  FlagTriangleRight,
  Plus,
  Star,
  Tag,
  X,
} from 'lucide-react'
import { Checkbox } from './ui/checkbox'
import {
  useAddTagToTodo,
  useCreateTag,
  useRemoveTagFromTodo,
  useUpdateTodo,
} from '@/utils/tanstack-query/useMutation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { InputWithIcon } from '@/components/ui/inputwithicon'
import { CalendarDropdown } from '@/components/calendar-dropdown'

export interface Tag {
  id: string
  name: string
  color: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export interface TodoComponentProps {
  id: string
  title: string
  description: string | null
  completed: boolean
  initialEditing?: boolean
  onEditStart: (id: string) => void
  onEditEnd: (id: string) => void
  handleDeleteTodo: (id: string) => Promise<void>
  startAt?: string | null
  dueAt?: string | null
  tags?: Array<Tag>
  todoTags?: Array<Tag> // Tags already associated with this todo
}

function formatStartAt(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )

  // Today
  if (diffDays === 0) {
    return { icon: Star, label: 'Today', color: '#FFD400' }
  }

  // Tomorrow
  if (diffDays === 1) {
    return { icon: CalendarDays, label: 'Tomorrow', color: '#FA1855' }
  }

  // Rest of this week (2–6 days ahead, same week)
  const dayOfWeek = now.getDay() // 0=Sun
  const daysUntilEndOfWeek = 7 - dayOfWeek // days left including today
  if (diffDays >= 2 && diffDays < daysUntilEndOfWeek) {
    const label = target.toLocaleDateString('en-US', { weekday: 'long' })
    return { icon: CalendarDays, label, color: '#FA1855' }
  }

  // Beyond this week
  const label = target.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return { icon: CalendarDays, label, color: '#FA1855' }
}

function formatDueAt(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )

  // Days-left suffix
  let remaining = ''
  if (diffDays < 0) {
    remaining = `${Math.abs(diffDays)}d overdue`
  } else if (diffDays === 0) {
    remaining = 'due today'
  } else if (diffDays === 1) {
    remaining = '1 day left'
  } else {
    remaining = `${diffDays} days left`
  }

  const isOverdue = diffDays < 0

  // Today
  if (diffDays === 0) {
    return {
      icon: Flag,
      label: 'Today',
      remaining,
      color: '#FFD400',
      isOverdue,
    }
  }

  // Tomorrow
  if (diffDays === 1) {
    return {
      icon: Flag,
      label: 'Tomorrow',
      remaining,
      color: '#fff',
      isOverdue,
    }
  }

  // Rest of this week
  const dayOfWeek = now.getDay()
  const daysUntilEndOfWeek = 7 - dayOfWeek
  if (diffDays >= 2 && diffDays < daysUntilEndOfWeek) {
    const label = target.toLocaleDateString('en-US', { weekday: 'long' })
    return { icon: Flag, label, remaining, color: '#fff', isOverdue }
  }

  // Beyond this week or overdue
  const label = target.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return {
    icon: Flag,
    label,
    remaining,
    color: isOverdue ? '#EF4444' : '#fff',
    isOverdue,
  }
}

export const TodoComponent = React.memo(
  React.forwardRef<HTMLDivElement, TodoComponentProps>((props, ref) => {
    const {
      id,
      title,
      description,
      completed,
      initialEditing = false,
      onEditStart,
      onEditEnd,
      handleDeleteTodo,
      startAt,
      dueAt,
      tags = [],
      todoTags = [],
    } = props
    const [isEditing, setIsEditing] = useState(initialEditing)
    const [editedTitle, setEditedTitle] = useState(title)
    const [editedDesc, setEditedDesc] = useState(description)
    const [isTagMenuOpen, setIsTagMenuOpen] = useState(false)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [isDueCalendarOpen, setIsDueCalendarOpen] = useState(false)
    const [tagSearch, setTagSearch] = useState('')
    const tagMenuCloseTimeRef = useRef(0)
    const calendarCloseTimeRef = useRef(0)
    const dueCalendarCloseTimeRef = useRef(0)
    const isTagMenuOpenRef = useRef(false)
    const isCalendarOpenRef = useRef(false)
    const isDueCalendarOpenRef = useRef(false)

    const updateTodoMutation = useUpdateTodo()
    const addTagToTodoMutation = useAddTagToTodo()
    const removeTagFromTodoMutation = useRemoveTagFromTodo()
    const createTagMutation = useCreateTag()

    const filteredTags = tagSearch.trim()
      ? tags.filter((tag) =>
          tag.name.toLowerCase().includes(tagSearch.trim().toLowerCase()),
        )
      : tags

    const hasExactMatch = tags.some(
      (tag) => tag.name.toLowerCase() === tagSearch.trim().toLowerCase(),
    )

    const randomTagColor = () => {
      const colors = [
        '#EF4444',
        '#F97316',
        '#F59E0B',
        '#EAB308',
        '#84CC16',
        '#22C55E',
        '#14B8A6',
        '#06B6D4',
        '#0EA5E9',
        '#3B82F6',
        '#6366F1',
        '#8B5CF6',
        '#A855F7',
        '#D946EF',
        '#EC4899',
      ]
      return colors[Math.floor(Math.random() * colors.length)]
    }

    const handleCreateTag = async () => {
      const name = tagSearch.trim()
      if (!name || hasExactMatch) return
      const color = randomTagColor()
      const result = await createTagMutation.mutateAsync({ name, color })
      await addTagToTodoMutation.mutateAsync({
        todoId: id,
        tagId: result.data.id,
      })
      setTagSearch('')
    }

    const handleToggleTag = async (tagId: string) => {
      const isTagAdded = todoTags.some((tag) => tag.id === tagId)
      if (isTagAdded) {
        await removeTagFromTodoMutation.mutateAsync({ todoId: id, tagId })
      } else {
        await addTagToTodoMutation.mutateAsync({ todoId: id, tagId })
      }
    }

    const internalRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const prevIsEditingRef = useRef(false)

    // Combine the forwarded ref with the internal ref
    const setRefs = (node: HTMLDivElement) => {
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
      internalRef.current = node
    }

    const handleInitEditing = (e: React.MouseEvent) => {
      // Check if clicked element is checkbox
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('[data-checkbox]')
      ) {
        return // Don't enter edit mode
      }
      onEditStart(id)
      setIsEditing(true)
    }

    const handleFormEditing = (event: React.ChangeEvent<HTMLFormElement>) => {
      // console.log('handleFormEditing')
      if (!isEditing) return
      const form = event.currentTarget
      const formData = new FormData(form)
      const rawTitle = formData.get('title') as string
      const rawDescription = formData.get('description') as string
      // console.log(`Raw Title: ${rawTitle}\nRaw Description: ${rawDescription}`)
      const trimmedTitle = rawTitle.trim()
      const trimmedDescription = rawDescription.trim()
      if (trimmedTitle !== title) setEditedTitle(trimmedTitle)
      if (trimmedDescription !== description) setEditedDesc(trimmedDescription)
    }

    const handleSaveEditing = useCallback(async () => {
      const trimmedTitle = editedTitle.trim()
      const trimmedDescription = editedDesc !== null ? editedDesc.trim() : ''
      if (
        (trimmedTitle !== title && trimmedTitle.length > 0) ||
        trimmedDescription !== description
      ) {
        await updateTodoMutation.mutateAsync({
          id,
          title: trimmedTitle,
          description: trimmedDescription,
        })
      } else if (trimmedTitle.length === 0) {
        handleDeleteTodo(id)
      }
      setIsEditing(false)
      onEditEnd(id)
    }, [
      editedTitle,
      editedDesc,
      title,
      description,
      updateTodoMutation,
      id,
      handleDeleteTodo,
      onEditEnd,
    ])

    const handleToggleComplete = async () => {
      // console.log('handleToggleComplete')
      await updateTodoMutation.mutateAsync({
        id: props.id,
        completed: !completed,
      })
    }

    const handleSelectDueDate = async (date: Date | null) => {
      await updateTodoMutation.mutateAsync({
        id,
        dueAt: date ? date.toISOString() : null,
      })
    }

    const handleSelectStartDate = async (date: Date | null) => {
      await updateTodoMutation.mutateAsync({
        id,
        startAt: date ? date.toISOString() : null,
      })
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
      // console.log('handleKeyDown')
      const isTextArea = event.target instanceof HTMLTextAreaElement
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        // Treat Cmd+Enter or Ctrl+Enter as save shortcut
        event.preventDefault()
        handleSaveEditing()
        return
      } else if (event.key === 'Enter' && !isTextArea) {
        event.preventDefault()
        handleSaveEditing()
      } else if (event.key === 'Escape') {
        setEditedTitle(title)
        setIsEditing(false)
        onEditEnd(id)
      }
    }

    const handleChangeDropdownMenu = (open: boolean) => {
      // Ignore phantom close caused by Radix dismiss cascade when the
      // calendar just closed from the same pointer event sequence.
      if (!open && Date.now() - calendarCloseTimeRef.current < 300) return
      setIsTagMenuOpen(open)
      isTagMenuOpenRef.current = open
      if (!open) {
        // Record when the menu closed so the click-outside handler can ignore
        // the same click that dismissed the dropdown
        tagMenuCloseTimeRef.current = Date.now()
        setTagSearch('')
      }
    }

    const handleChangeCalendar = (open: boolean) => {
      // Ignore phantom close caused by Radix dismiss cascade when the
      // tag menu just closed from the same pointer event sequence.
      if (!open && Date.now() - tagMenuCloseTimeRef.current < 300) return
      if (!open && Date.now() - dueCalendarCloseTimeRef.current < 300) return
      setIsCalendarOpen(open)
      isCalendarOpenRef.current = open
      if (!open) {
        calendarCloseTimeRef.current = Date.now()
      }
    }

    const handleChangeDueCalendar = (open: boolean) => {
      if (!open && Date.now() - tagMenuCloseTimeRef.current < 300) return
      if (!open && Date.now() - calendarCloseTimeRef.current < 300) return
      setIsDueCalendarOpen(open)
      isDueCalendarOpenRef.current = open
      if (!open) {
        dueCalendarCloseTimeRef.current = Date.now()
      }
    }

    // Focus title input only when entering edit mode
    useEffect(() => {
      if (isEditing && !prevIsEditingRef.current && inputRef.current) {
        inputRef.current.focus()
        // inputRef.current.select() // ← Select all text for easy editing
      }
      prevIsEditingRef.current = isEditing
    }, [isEditing])

    // Handle click outside to save
    useEffect(() => {
      if (!isEditing) return

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node
        if (!internalRef.current || internalRef.current.contains(target)) return

        // Don't save while a portaled dropdown/popover is open — their content
        // lives outside the todo DOM tree but should be treated as "inside".
        if (
          isTagMenuOpenRef.current ||
          isCalendarOpenRef.current ||
          isDueCalendarOpenRef.current
        )
          return

        // If the tag dropdown or calendar just closed (<300ms ago), this click was the one
        // that dismissed it — don't also exit editing mode.
        if (Date.now() - tagMenuCloseTimeRef.current < 300) return
        if (Date.now() - calendarCloseTimeRef.current < 300) return
        if (Date.now() - dueCalendarCloseTimeRef.current < 300) return

        // Don't trigger when clicking elements that should handle their own click (e.g. delete button)
        if (
          target instanceof HTMLElement &&
          target.closest('[data-ignore-click-outside]')
        ) {
          return
        }

        handleSaveEditing()
      }

      document.addEventListener('mousedown', handleClickOutside)
      // Cleanup event listener when editing ends or component unmounts
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isEditing, handleSaveEditing])

    return (
      <div ref={setRefs} className="w-full">
        <motion.form
          // layout
          initial={{
            padding: '0rem 1rem',
          }}
          animate={{
            backgroundColor: isEditing ? '#343338' : '#26252800',
            padding: isEditing ? '1rem 1rem' : '0rem 1rem',
            margin: isEditing ? '10px 0px' : '0px 0px',
            // boxShadow: isEditing
            //   ? '0px 4px 6px -1px rgb(0 0 0 / 0.1)'
            //   : '0px 0px',
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="h-fit w-full flex flex-col items-start rounded-lg"
          onChange={handleFormEditing}
          onKeyDown={handleKeyDown}
        >
          <div className="w-full flex gap-2">
            <Checkbox
              data-checkbox
              checked={completed}
              onCheckedChange={handleToggleComplete}
              className="size-3 mt-1 rounded-[3px] border-core-background/30 data-[state=checked]:border-0 data-[state=checked]:bg-[#18AEF8] data-[state=checked]:text-core-foreground"
            />
            <div className="w-full flex flex-col justify-start items-start">
              <div onClick={handleInitEditing} className="relative w-full">
                {isEditing ? (
                  <input
                    ref={inputRef}
                    id={`title-${id}`}
                    name="title"
                    type="text"
                    defaultValue={editedTitle}
                    // onChange={handleEditing}
                    // onKeyDown={handleKeyDown}
                    disabled={updateTodoMutation.isPending}
                    className="w-[80%] border-0! ring-0! outline-none! shadow-none focus-visible:border-0! focus-visible:ring-0 focus-visible:outline-none"
                  />
                ) : (
                  <div className="flex justify-start items-center gap-3">
                    <span className="w-fit truncate">{editedTitle}</span>
                    {todoTags.length > 0 && (
                      <div className="flex justify-start items-center text-sloth-foreground/70 text-[0.75rem] gap-1">
                        {todoTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="border px-2 rounded-full lowercase"
                            style={{
                              borderColor: tag.color
                                ? `${tag.color}50`
                                : '#80808050',
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <AnimatePresence initial={false}>
                {isEditing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: 'auto',
                      opacity: 1,
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                    }}
                    className="w-full overflow-hidden"
                  >
                    <textarea
                      id={`description-${id}`}
                      name="description"
                      placeholder="Notes"
                      defaultValue={description ?? ''}
                      className="mt-2 mb-4 min-h-10 w-full field-sizing-content resize-none outline-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {isEditing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: 'auto',
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              className="w-full"
            >
              {todoTags.length > 0 && (
                <div className="px-2 flex gap-2 text-[0.75rem] flex-wrap">
                  {todoTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="group/tag inline-flex items-center gap-0.5 px-2 py-0.5 rounded-sm font-semibold cursor-default"
                      style={{
                        backgroundColor: tag.color
                          ? `${tag.color}90`
                          : '#80808090',
                      }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        className="hidden group-hover/tag:inline-flex items-center justify-center size-3 rounded-full"
                        onClick={() =>
                          removeTagFromTodoMutation.mutateAsync({
                            todoId: id,
                            tagId: tag.id,
                          })
                        }
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 flex justify-between items-end">
                <div className="flex flex-col items-start">
                  {startAt &&
                    (() => {
                      const {
                        icon: StartIcon,
                        label,
                        color,
                      } = formatStartAt(startAt)
                      return (
                        <Button
                          type="button"
                          variant="none"
                          size="sm"
                          className="group h-6 hover:bg-[#4c4c50] rounded-md [&_svg]:pointer-events-auto text-xs gap-0.75 font-semibold"
                        >
                          <StartIcon
                            className="size-3"
                            color={color}
                            {...(StartIcon === Star ? { fill: color } : {})}
                          />
                          <span>{label}</span>
                          <X
                            className="ml-1 size-3 invisible group-hover:visible cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectStartDate(null)
                            }}
                          />
                        </Button>
                      )
                    })()}
                  {dueAt &&
                    (() => {
                      const {
                        icon: DueIcon,
                        label,
                        remaining,
                        color,
                        isOverdue,
                      } = formatDueAt(dueAt)
                      return (
                        <Button
                          type="button"
                          variant="none"
                          size="sm"
                          className="group h-6 hover:bg-[#4c4c50] rounded-md [&_svg]:pointer-events-auto text-xs gap-0.75 font-semibold"
                        >
                          <DueIcon
                            fill={color}
                            className="size-3"
                            style={{ color }}
                          />
                          <span>Deadline: {label}</span>
                          <span
                            className={cn(
                              'text-[0.65rem] opacity-60',
                              isOverdue && 'text-red-400 opacity-100',
                            )}
                          >
                            {remaining}
                          </span>
                          <X
                            className="ml-1 size-3 invisible group-hover:visible cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectDueDate(null)
                            }}
                          />
                        </Button>
                      )
                    })()}
                </div>

                <div className="flex items-center gap-0.5">
                  {!startAt && (
                    <CalendarDropdown
                      open={isCalendarOpen}
                      onOpenChange={handleChangeCalendar}
                      selectedDate={startAt ? new Date(startAt) : null}
                      onSelectDate={handleSelectStartDate}
                    />
                  )}

                  <DropdownMenu
                    data-ignore-click-outside
                    open={isTagMenuOpen}
                    onOpenChange={handleChangeDropdownMenu}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="none"
                        size="none"
                        className={cn(
                          'group p-1 hover:bg-[#4c4c50] rounded-md [&_svg]:pointer-events-auto outline-none border-0 ring-0',
                          isTagMenuOpen && 'bg-sloth-background-hover-2',
                        )}
                      >
                        <Tag size={12} />
                      </Button>
                      {/* <Input
                      data-ignore-click-outside
                      className="bt my-0.5 w-fit h-6 rounded-md ring-0 focus-visible:ring-0 border-0 focus:bg-sloth-aside-background-hover"
                      onKeyDown={(e) => e.stopPropagation()}
                    /> */}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 bg-sloth-aside-background border-0 shadow-none rounded-lg text-core-background"
                    >
                      {/* <Input
                    data-ignore-click-outside
                    className="my-0.5 h-6 rounded-md ring-0 focus-visible:ring-0 border-0 focus:bg-sloth-aside-background-hover"
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Add new tag"
                  /> */}
                      <InputWithIcon
                        data-ignore-click-outside
                        id="tag-input"
                        name="new-tag"
                        type="text"
                        autoComplete="off"
                        placeholder="Search or add tag"
                        startIcon={Plus}
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        className="my-0.5 h-6 rounded-md ring-0 focus-visible:ring-0 border-0 focus:bg-sloth-aside-background-hover"
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateTag()
                          }
                        }}
                      />
                      {filteredTags.length > 0
                        ? filteredTags.map((tag) => {
                            const isTagAdded = todoTags.some(
                              (todoTag) => todoTag.id === tag.id,
                            )
                            return (
                              <DropdownMenuItem
                                data-ignore-click-outside
                                key={tag.id}
                                className="flex items-center gap-2 cursor-pointer h-fit py-1 rounded-md hover:bg-sloth-aside-background-hover hover:text-core-background focus:bg-transparent focus:text-inherit"
                                onPointerMove={(e) => e.preventDefault()}
                                onPointerLeave={(e) => e.preventDefault()}
                                onSelect={(e) => {
                                  e.preventDefault()
                                  handleToggleTag(tag.id)
                                }}
                              >
                                <span
                                  className="size-2 rounded-full"
                                  style={{
                                    backgroundColor: tag.color || '#808080',
                                  }}
                                />
                                <span className="flex-1">{tag.name}</span>
                                {isTagAdded && (
                                  <Check className="size-3" strokeWidth={3} />
                                )}
                              </DropdownMenuItem>
                            )
                          })
                        : null}
                      {tagSearch.trim() && !hasExactMatch && (
                        <DropdownMenuItem
                          data-ignore-click-outside
                          className="flex items-center gap-2 cursor-pointer h-fit py-1 rounded-md hover:bg-sloth-aside-background-hover hover:text-core-background focus:bg-transparent focus:text-inherit"
                          onPointerMove={(e) => e.preventDefault()}
                          onPointerLeave={(e) => e.preventDefault()}
                          onSelect={(e) => {
                            e.preventDefault()
                            handleCreateTag()
                          }}
                        >
                          <Plus size={12} />
                          <span>
                            Create "<strong>{tagSearch.trim()}</strong>"
                          </span>
                        </DropdownMenuItem>
                      )}
                      {!tagSearch.trim() && tags.length === 0 && (
                        <DropdownMenuItem disabled>
                          No tags available
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {!dueAt && (
                    <CalendarDropdown
                      open={isDueCalendarOpen}
                      onOpenChange={handleChangeDueCalendar}
                      selectedDate={dueAt ? new Date(dueAt) : null}
                      onSelectDate={handleSelectDueDate}
                      icon={Flag}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.form>
      </div>
    )
  }),
)
