import { Hono } from 'hono'
import { getTodos } from './db/queries'
import { auth } from './lib/auth'
import { todos } from './routes/todos.routes'


const app = new Hono().basePath('/api')

const router = app
.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))
.route('/todos', todos)
.get('/todos', async (c) => {
  try {
    const todos = await getTodos()
    return c.json(todos)
  } catch (error) {
    console.error('Error fetching todos:', error)
    return c.json({ error: 'Failed to fetch todos' }, 500)
  }
})
.get('/people', (c) => {
  return c.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ])
})

export type AppType = typeof router
export default app
