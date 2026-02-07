import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hc } from 'hono/client'
import { toast } from 'sonner'
import type { AppType } from '../../../../server'

const client = hc<AppType>('/')

// Mutation to create a new todo
export const useCreateTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      title,
      description,
    }: {
      title: string
      description?: string
    }) => {
      const res = await client.api.todos.$post({
        json: {
          title,
          description,
        },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create todo')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      toast.success('Todo created successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export const useUpdateTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      completed,
    }: {
      id: string
      title?: string
      description?: string
      completed?: boolean
    }) => {
      const res = await client.api.todos[':id'].$patch({
        param: { id },
        json: {
          title,
          description,
          completed,
        },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update todo')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      // toast.success('Todo updated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
