import { Hono } from 'hono'
import { getTodosByUserId } from '../db/queries'
import { authMiddleware } from '../middlewares/auth.middleware'
import { HonoEnv } from '../types'

export const todos = new Hono<HonoEnv>()

todos.use(authMiddleware)

todos.get('/', async (c) => {
  const user = c.get('user')

  try {
    const todos = await getTodosByUserId(user.id);
    return c.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return c.json({ error: 'Failed to fetch todos'}, 500)
  }
})
