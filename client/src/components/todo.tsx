import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, Check, Flag, Plus, Star, X } from 'lucide-react'
import {
  Asterisk02Icon,
  Calendar03Icon,
  Flag03Icon,
  Tag01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Checkbox } from './ui/checkbox'
import type { Tag } from 'lucide-react'
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
  // DropdownMenuPortal,
  // DropdownMenuSeparator,
  // DropdownMenuSub,
  // DropdownMenuSubContent,
  // DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { InputWithIcon } from '@/components/ui/inputwithicon'
import {
  CalendarDropdown,
  CalendarDropdownContent,
} from '@/components/calendar-dropdown'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useIsMobile } from '@/hooks/use-mobile'

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

const TAG_COLORS = [
  '#18AEF8',
  '#7EBC89',
  '#29335C',
  '#D8B4A0',
  '#D77A61',
  '#FFD400',
  '#ED7B84',
  '#FA1855',
  '#39A99D',
  '#A491D3',
]

const randomTagColor = () => {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
}

export const TodoComponent = React.memo(
  React.forwardRef<HTMLDivElement, TodoComponentProps & { className?: string }>(
    (props, ref) => {
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
        className,
      } = props
      const [isEditing, setIsEditing] = useState(initialEditing)
      const [editedTitle, setEditedTitle] = useState(title)
      const [editedDesc, setEditedDesc] = useState(description)
      const [isTagMenuOpen, setIsTagMenuOpen] = useState(false)
      const [isCalendarOpen, setIsCalendarOpen] = useState(false)
      const [isDueCalendarOpen, setIsDueCalendarOpen] = useState(false)
      const [tagSearch, setTagSearch] = useState('')
      const [isColorPanelOpen, setIsColorPanelOpen] = useState(false)
      const [selectedTagColor, setSelectedTagColor] = useState<string | null>(
        randomTagColor(),
      )
      const tagMenuCloseTimeRef = useRef(0)
      const calendarCloseTimeRef = useRef(0)
      const dueCalendarCloseTimeRef = useRef(0)
      const isTagMenuOpenRef = useRef(false)
      const isCalendarOpenRef = useRef(false)
      const isDueCalendarOpenRef = useRef(false)

      const isMobile = useIsMobile()
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

      // const randomTagColor = () => {
      //   return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
      // }

      // const handleRandomTagColorOnOpenTag = () => {
      //   if (isTagMenuOpen) setSelectedTagColor(randomTagColor())
      // }

      const handleCreateTag = async () => {
        const name = tagSearch.trim()
        if (!name || hasExactMatch) return
        const color = selectedTagColor ?? randomTagColor()
        const result = await createTagMutation.mutateAsync({ name, color })
        await addTagToTodoMutation.mutateAsync({
          todoId: id,
          tagId: result.data.id,
        })
        setTagSearch('')
        setSelectedTagColor(randomTagColor())
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
      // const inputRef = useRef<HTMLInputElement>(null)
      const inputRef = useRef<HTMLTextAreaElement>(null)
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
        if (trimmedDescription !== description)
          setEditedDesc(trimmedDescription)
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
        console.log(date)
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
          setIsColorPanelOpen(false)
          // setSelectedTagColor(null)
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

      const autoResizeTextarea = useCallback(() => {
        const el = inputRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
      }, [])

      // Focus title input only when entering edit mode (skip on mobile to avoid keyboard popup)
      useEffect(() => {
        if (isEditing && !prevIsEditingRef.current && inputRef.current) {
          if (!isMobile) {
            inputRef.current.focus()
          }
          autoResizeTextarea()
        }
        prevIsEditingRef.current = isEditing
      }, [isEditing, isMobile, autoResizeTextarea])

      // Handle click outside to save
      useEffect(() => {
        if (!isEditing) return

        const handleClickOutside = (event: MouseEvent) => {
          const target = event.target as Node
          if (!internalRef.current || internalRef.current.contains(target))
            return

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

          // Prevent the same pointer's click from opening another todo
          const blockClick = (e: MouseEvent) => {
            document.removeEventListener('click', blockClick, true)
            const clickTarget = e.target as Node | null
            const el =
              clickTarget instanceof Element
                ? clickTarget
                : clickTarget?.parentElement
            if (!el) return
            const clickedTodo = el.closest('[data-todo-id]')
            if (
              clickedTodo &&
              clickedTodo.getAttribute('data-todo-id') !== id
            ) {
              e.preventDefault()
              e.stopPropagation()
            }
          }
          document.addEventListener('click', blockClick, true)
        }

        document.addEventListener('mousedown', handleClickOutside)
        // Cleanup event listener when editing ends or component unmounts
        return () => {
          document.removeEventListener('mousedown', handleClickOutside)
        }
      }, [isEditing, handleSaveEditing, id])

      return (
        <div
          ref={setRefs}
          data-todo-id={id}
          className={cn('w-full min-w-0', className)}
        >
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
            className="h-fit w-full min-w-0 flex flex-col items-start rounded-lg"
            onChange={handleFormEditing}
            onKeyDown={handleKeyDown}
          >
            {/* title-description */}
            <div className="w-full min-w-0 flex gap-2">
              <Checkbox
                data-checkbox
                checked={completed}
                onCheckedChange={handleToggleComplete}
                className="size-4 md:size-3.5 mt-1.5 md:mt-[0.3rem] shrink-0 rounded-[3px] border-core-background/30 data-[state=checked]:border-0 data-[state=checked]:bg-[#18AEF8] data-[state=checked]:text-core-foreground"
              />
              <div className="min-w-0 flex-1 flex flex-col justify-start items-start overflow-hidden">
                <div
                  onClick={handleInitEditing}
                  className="relative w-full min-w-0 overflow-hidden"
                >
                  {isEditing ? (
                    // <input
                    //   ref={inputRef}
                    //   id={`title-${id}`}
                    //   name="title"
                    //   type="text"
                    //   defaultValue={editedTitle}
                    //   // onChange={handleEditing}
                    //   // onKeyDown={handleKeyDown}
                    //   disabled={updateTodoMutation.isPending}
                    //   className="w-[95%] md:w-[80%] border-0 bt ring-0! outline-none! shadow-none focus-visible:border-0! focus-visible:ring-0 focus-visible:outline-none flex-wrap"
                    // />

                    <textarea
                      ref={inputRef}
                      id={`title-${id}`}
                      name="title"
                      defaultValue={editedTitle}
                      disabled={updateTodoMutation.isPending}
                      onInput={autoResizeTextarea}
                      // onKeyDown={(e) => {
                      //   if (e.key === 'Enter') e.preventDefault()
                      // }}
                      className="w-[95%] md:w-[80%] text-lg md:text-base focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none resize-none overflow-hidden"
                      rows={1}
                    />
                  ) : (
                    <div className="relative w-full flex justify-start items-center gap-2 md:gap-3 cursor-pointer min-w-0">
                      <span className="w-fit min-w-0 truncate text-lg md:text-base">
                        {editedTitle}
                      </span>
                      {todoTags.length > 0 && (
                        <>
                          <Tag className="md:hidden size-3 shrink-0 text-sloth-foreground/70" />
                          <div className="hidden md:flex justify-start items-center text-sloth-foreground/70 text-[0.75rem] gap-1">
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
                        </>
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
                        className="mt-2 mb-4 min-h-10 w-full field-sizing-content resize-none outline-none text-base md:text-sm"
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
                {/* tag */}
                {todoTags.length > 0 && (
                  <div className="px-2 flex gap-2 text-[0.75rem] flex-wrap">
                    {todoTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="group/tag inline-flex items-center gap-0.5 px-2 py-0.5 rounded-sm font-bold md:font-semibold cursor-default"
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
                  {/* startAt-dueAt */}
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
                            className="group h-6 hover:bg-[#4c4c50] rounded-md [&_svg]:pointer-events-auto text-sm md:text-xs gap-0.75 font-semibold"
                            onClick={
                              isMobile
                                ? () => {
                                    handleChangeCalendar(true)
                                  }
                                : () => null
                            }
                          >
                            {/* <StartIcon
                              className="size-4 md:size-3"
                              color={color}
                              {...(StartIcon === Star ? { fill: color } : {})}
                            /> */}
                            {isToday ? (
                              <HugeiconsIcon
                                icon={Asterisk02Icon}
                                color={color}
                                strokeWidth={2.5}
                                className="size-4 md:size-3"
                                fill={color}
                              />
                            ) : (
                              <HugeiconsIcon
                                icon={Calendar03Icon}
                                color={color}
                                strokeWidth={2.2}
                                className="group-disabled:grayscale"
                              />
                            )}
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
                            className="group h-6 hover:bg-[#4c4c50] rounded-md [&_svg]:pointer-events-auto text-sm md:text-xs gap-0.75 font-semibold"
                            onClick={
                              isMobile
                                ? () => {
                                    handleChangeDueCalendar(true)
                                  }
                                : () => null
                            }
                          >
                            {/* <DueIcon
                              fill={color}
                              className="size-4 md:size-3"
                              style={{ color }}
                            /> */}
                            <HugeiconsIcon
                              icon={Flag03Icon}
                              className="mr-0.5 size-4 md:size-3"
                              strokeWidth={2}
                              style={{ color }}
                              fill={color}
                            />
                            <span>Deadline: {label}</span>
                            <span
                              className={cn(
                                'ml-1 text-[0.65rem] opacity-60',
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

                  {/* calendar-tag-calendar */}
                  <div className="flex items-center gap-1 md:gap-0.5">
                    {isMobile ? (
                      <>
                        {!startAt && (
                          <Button
                            type="button"
                            variant="none"
                            size="none"
                            onClick={() => handleChangeCalendar(true)}
                            className="p-1"
                          >
                            {/* <CalendarDays className="size-4 md:size-3" /> */}
                            <HugeiconsIcon
                              icon={Calendar03Icon}
                              className="size-5 md:size-3"
                              strokeWidth={2}
                            />
                          </Button>
                        )}
                        <Dialog
                          open={isCalendarOpen}
                          onOpenChange={handleChangeCalendar}
                        >
                          <DialogContent className="w-[80%] bg-sloth-aside-background text-sloth-foreground p-4 gap-4 max-h-[85vh] overflow-y-auto rounded-xl">
                            <DialogHeader>
                              <DialogTitle>When?</DialogTitle>
                            </DialogHeader>
                            <CalendarDropdownContent
                              className="w-full"
                              selectedDate={startAt ? new Date(startAt) : null}
                              onSelectDate={handleSelectStartDate}
                              onClose={() => handleChangeCalendar(false)}
                            />
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
                      !startAt && (
                        <CalendarDropdown
                          open={isCalendarOpen}
                          onOpenChange={handleChangeCalendar}
                          selectedDate={startAt ? new Date(startAt) : null}
                          onSelectDate={handleSelectStartDate}
                        />
                      )
                    )}

                    {isMobile ? (
                      <>
                        <Button
                          type="button"
                          variant="none"
                          size="none"
                          className={cn(
                            'group p-1 hover:bg-[#4c4c50] rounded-md [&_svg]:pointer-events-auto outline-none border-0 ring-0',
                            isTagMenuOpen && 'bg-sloth-background-hover-2',
                          )}
                          onClick={() => handleChangeDropdownMenu(true)}
                        >
                          <Tag className="size-4 md:size-3" />
                        </Button>
                        <Dialog
                          open={isTagMenuOpen}
                          onOpenChange={handleChangeDropdownMenu}
                        >
                          <DialogContent
                            showCloseButton={true}
                            className="w-[80%] max-w-sm border-0 bg-sloth-aside-background text-sloth-foreground p-4 pb-6 gap-4 max-h-[85vh] overflow-y-auto rounded-xl"
                          >
                            <DialogHeader>
                              <DialogTitle>Tags</DialogTitle>
                            </DialogHeader>
                            <div className="relative w-full max-w-sm mx-auto flex flex-col gap-2">
                              <AnimatePresence>
                                {isColorPanelOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                      duration: 0.15,
                                      ease: 'easeOut',
                                    }}
                                    className="w-30 bg-sloth-aside-background rounded-lg p-2 pt-0 shadow-lg"
                                  >
                                    <span className="text-muted-foreground text-xs">
                                      Tag color
                                    </span>
                                    <div className="grid grid-cols-5 gap-2 mt-1">
                                      {TAG_COLORS.map((color) => (
                                        <button
                                          key={color}
                                          type="button"
                                          className={cn(
                                            'size-4 rounded cursor-pointer transition-transform hover:scale-110 focus:outline-none',
                                            selectedTagColor === color &&
                                              'ring-1 ring-sloth-foreground/50 ring-offset-1 ring-offset-sloth-aside-background',
                                          )}
                                          style={{ backgroundColor: color }}
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setSelectedTagColor(color)
                                            setIsColorPanelOpen(false)
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <div className="relative flex items-center">
                                <Button
                                  size="icon-xs"
                                  type="button"
                                  className="z-10 absolute top-1/2 -translate-y-1/2 left-1.5 bg-sloth-aside-background/0 hover:bg-sloth-aside-background/0"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setIsColorPanelOpen((prev) => !prev)
                                  }}
                                >
                                  <span
                                    className="size-5 md:size-4 rounded"
                                    style={{
                                      backgroundColor:
                                        selectedTagColor ?? '#000000',
                                    }}
                                  />
                                </Button>
                                <InputWithIcon
                                  data-ignore-click-outside
                                  id="tag-input-mobile"
                                  name="new-tag-mobile"
                                  type="text"
                                  autoComplete="off"
                                  placeholder="Search or add tag"
                                  value={tagSearch}
                                  onChange={(e) => setTagSearch(e.target.value)}
                                  className="w-full md:my-0.5 pl-10 md:pl-7 h-8.5 md:h-6.5 text-base rounded-md ring-0 focus-visible:ring-0 border-0 focus:bg-sloth-aside-background-hover"
                                  onKeyDown={(e) => {
                                    e.stopPropagation()
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      handleCreateTag()
                                    }
                                  }}
                                />
                              </div>

                              <div className="relative">
                                <div className="flex flex-col gap-0.5 max-h-50 pb-4 overflow-y-auto">
                                  {filteredTags.length > 0
                                    ? filteredTags.map((tag) => {
                                        const isTagAdded = todoTags.some(
                                          (todoTag) => todoTag.id === tag.id,
                                        )
                                        return (
                                          <button
                                            key={tag.id}
                                            type="button"
                                            className="flex items-center gap-2 cursor-pointer h-fit py-1 px-2 rounded-md hover:bg-sloth-aside-background-hover hover:text-core-background text-left w-full"
                                            onClick={() => {
                                              handleToggleTag(tag.id)
                                              // handleChangeDropdownMenu(false)
                                            }}
                                          >
                                            <span
                                              className="size-4 md:size-2 rounded-full shrink-0"
                                              style={{
                                                backgroundColor:
                                                  tag.color || '#808080',
                                              }}
                                            />
                                            <span className="flex-1">
                                              {tag.name}
                                            </span>
                                            {isTagAdded && (
                                              <Check
                                                className="size-3 shrink-0"
                                                strokeWidth={3}
                                              />
                                            )}
                                          </button>
                                        )
                                      })
                                    : null}

                                  {tagSearch.trim() && !hasExactMatch && (
                                    <button
                                      type="button"
                                      className="flex items-center gap-2 cursor-pointer h-fit py-2 px-2 rounded-md hover:bg-sloth-aside-background-hover hover:text-core-background text-left w-full"
                                      onClick={() => {
                                        handleCreateTag()
                                        handleChangeDropdownMenu(false)
                                      }}
                                    >
                                      <Plus size={12} />
                                      <span>
                                        Create "
                                        <strong>{tagSearch.trim()}</strong>"
                                      </span>
                                    </button>
                                  )}
                                  {!tagSearch.trim() && tags.length === 0 && (
                                    <div className="py-2 px-2 text-muted-foreground text-sm">
                                      No tags available
                                    </div>
                                  )}
                                </div>
                                {/* <div
                                aria-hidden
                                className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-sloth-aside-background to-transparent"
                              /> */}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
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
                            {/* <Tag size={12} /> */}
                            <HugeiconsIcon
                              icon={Tag01Icon}
                              className="size-3.5 -rotate-90"
                              strokeWidth={2.2}
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="relative w-48 bg-sloth-aside-background border-0 shadow-none rounded-lg text-core-background overflow-visible"
                        >
                          <AnimatePresence>
                            {isColorPanelOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="absolute right-full top-0 mr-2 w-30 bg-sloth-aside-background rounded-lg p-2 pt-0 shadow-lg z-50 origin-top-right"
                              >
                                <span className="text-muted-foreground text-xs">
                                  Tag color
                                </span>
                                <div className="grid grid-cols-5 gap-2 mt-1">
                                  {TAG_COLORS.map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      className={cn(
                                        'size-4 rounded cursor-pointer transition-transform hover:scale-110 focus:outline-none',
                                        selectedTagColor === color &&
                                          'ring-1 ring-sloth-foreground/50 ring-offset-1 ring-offset-sloth-aside-background',
                                      )}
                                      style={{ backgroundColor: color }}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setSelectedTagColor(color)
                                        setIsColorPanelOpen(false)
                                      }}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="relative flex items-center">
                            <Button
                              size="icon-xs"
                              type="button"
                              className="z-10 absolute top-0.75 lef-0 bg-sloth-aside-background/0 hover:bg-sloth-aside-background/0"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsColorPanelOpen((prev) => !prev)
                              }}
                            >
                              <span
                                className="size-3.5 rounded-xs"
                                style={{
                                  backgroundColor:
                                    selectedTagColor ?? '#000000',
                                }}
                              />
                            </Button>
                            <InputWithIcon
                              data-ignore-click-outside
                              id="tag-input"
                              name="new-tag"
                              type="text"
                              autoComplete="off"
                              placeholder="Search or add tag"
                              value={tagSearch}
                              onChange={(e) => setTagSearch(e.target.value)}
                              className="my-0.5 pl-7 h-6.5 rounded-md ring-0 focus-visible:ring-0 border-0 focus:bg-sloth-aside-background-hover"
                              onKeyDown={(e) => {
                                e.stopPropagation()
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleCreateTag()
                                }
                              }}
                            />
                          </div>
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
                                      <Check
                                        className="size-3"
                                        strokeWidth={3}
                                      />
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
                    )}

                    {/* {!dueAt &&
                    (isMobile ? (
                      <>
                        <Button
                          type="button"
                          variant="none"
                          size="none"
                          onClick={() => handleChangeDueCalendar(true)}
                          className="p-1"
                        >
                          <Flag className="size-4 md:size-3" />
                        </Button>
                        <Dialog
                          open={isDueCalendarOpen}
                          onOpenChange={handleChangeDueCalendar}
                        >
                          <DialogContent className="w-[80%] bg-sloth-aside-background text-sloth-foreground p-4 gap-4 max-h-[85vh] overflow-y-auto rounded-xl">
                            <DialogHeader>
                              <DialogTitle>Due date?</DialogTitle>
                            </DialogHeader>
                            <CalendarDropdownContent
                              className="w-full"
                              selectedDate={dueAt ? new Date(dueAt) : null}
                              onSelectDate={handleSelectDueDate}
                              onClose={() => handleChangeDueCalendar(false)}
                            />
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
                      <CalendarDropdown
                        open={isDueCalendarOpen}
                        onOpenChange={handleChangeDueCalendar}
                        selectedDate={dueAt ? new Date(dueAt) : null}
                        onSelectDate={handleSelectDueDate}
                        icon={Flag}
                      />
                    ))} */}

                    {isMobile ? (
                      <>
                        {!dueAt && (
                          <Button
                            type="button"
                            variant="none"
                            size="none"
                            onClick={() => handleChangeDueCalendar(true)}
                            className="p-1"
                          >
                            {/* <Flag className="size-4 md:size-3" /> */}
                            <HugeiconsIcon
                              icon={Flag03Icon}
                              className="size-5"
                              strokeWidth={2}
                            />
                          </Button>
                        )}
                        <Dialog
                          open={isDueCalendarOpen}
                          onOpenChange={handleChangeDueCalendar}
                        >
                          <DialogContent className="w-[80%] bg-sloth-aside-background text-sloth-foreground p-4 gap-4 max-h-[85vh] overflow-y-auto rounded-xl">
                            <DialogHeader>
                              <DialogTitle>Due date?</DialogTitle>
                            </DialogHeader>
                            <CalendarDropdownContent
                              className="w-full"
                              selectedDate={dueAt ? new Date(dueAt) : null}
                              onSelectDate={handleSelectDueDate}
                              onClose={() => handleChangeDueCalendar(false)}
                            />
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
                      <CalendarDropdown
                        open={isDueCalendarOpen}
                        onOpenChange={handleChangeDueCalendar}
                        selectedDate={dueAt ? new Date(dueAt) : null}
                        onSelectDate={handleSelectDueDate}
                        calendarType="due"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.form>
        </div>
      )
    },
  ),
)
