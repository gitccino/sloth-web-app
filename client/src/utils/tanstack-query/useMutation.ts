import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { hc } from 'hono/client'
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
        json: { title, description },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create todo')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
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
      startAt,
      dueAt,
    }: {
      id: string
      title?: string
      description?: string
      completed?: boolean
      startAt?: string | null
      dueAt?: string | null
    }) => {
      const res = await client.api.todos[':id'].$patch({
        param: { id },
        json: { title, description, completed, startAt, dueAt },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update todo')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export const useDeleteTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await client.api.todos[':id'].$delete({
        param: { id },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete todo')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export const useAddTagToTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      todoId,
      tagId,
    }: {
      todoId: string
      tagId: string
    }) => {
      const res = await client.api.todos[':id'].tags.$post({
        param: { id: todoId },
        json: { tagId },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to add tag to todo')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export const useCreateTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const res = await client.api.tags.$post({
        json: { name, color },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(
          ('error' in errorData && errorData.error) || 'Failed to create tag',
        )
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export const useDeleteTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await client.api.tags[':id'].$delete({
        param: { id },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(
          ('error' in errorData && errorData.error) || 'Failed to delete tag',
        )
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export const useRemoveTagFromTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      todoId,
      tagId,
    }: {
      todoId: string
      tagId: string
    }) => {
      const res = await client.api.todos[':id'].tags[':tagId'].$delete({
        param: { id: todoId, tagId },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to remove tag from todo')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
