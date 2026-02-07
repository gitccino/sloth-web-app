import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Checkbox } from './ui/checkbox'
import { useUpdateTodo } from '@/utils/tanstack-query/useMutation'

export interface TodoComponentProps {
  id: string
  title: string
  completed: boolean
}

export const TodoComponent = React.forwardRef<
  HTMLDivElement,
  TodoComponentProps
>((props, ref) => {
  const { id, title, completed } = props
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)

  const updateTodoMutation = useUpdateTodo()

  const internalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
    setIsEditing(true)
  }

  const handleEditing = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(event.target.value)
  }

  const handleSaveEditing = async () => {
    const trimmedTitle = editedTitle.trim()
    if (trimmedTitle !== title && trimmedTitle.length > 0) {
      await updateTodoMutation.mutateAsync({
        id,
        title: trimmedTitle,
      })
    }
    setIsEditing(false)
  }

  const handleToggleComplete = async () => {
    await updateTodoMutation.mutateAsync({
      id: props.id,
      completed: !completed,
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSaveEditing()
    } else if (event.key === 'Escape') {
      setEditedTitle(title)
      setIsEditing(false)
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // inputRef.current.select() // ← Select all text for easy editing
    }

    if (!isEditing) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        internalRef.current &&
        !internalRef.current.contains(event.target as Node)
      ) {
        handleSaveEditing()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    // Cleanup event listener when editing ends or component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, handleSaveEditing])

  return (
    <div ref={setRefs}>
      <motion.form
        layout
        animate={{
          backgroundColor: isEditing ? '#fffcec10' : 'rgba(0,0,0,0)',
          padding: isEditing ? '0.5rem 1rem' : '0rem 0.25rem',
          margin: isEditing ? '10px 0px' : '0px 0px',
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="flex items-center gap-2 rounded-xl"
      >
        <Checkbox
          data-checkbox
          checked={completed}
          onCheckedChange={handleToggleComplete}
        />
        <div onClick={handleInitEditing} className="relative w-50">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={handleEditing}
              onKeyDown={handleKeyDown}
              disabled={updateTodoMutation.isPending}
              className="w-full border-0! ring-0! outline-none! shadow-none focus-visible:border-0! focus-visible:ring-0 focus-visible:outline-none"
            />
          ) : (
            <span className="w-full truncate">{editedTitle}</span>
          )}
        </div>
      </motion.form>
    </div>
  )
})
