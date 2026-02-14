import { asc, desc, eq, and } from "drizzle-orm";
import { db } from "./db";
import { todos, tags, todoTags } from "./schema";

export const getTodos = async () => {
  return await db.select().from(todos).orderBy(asc(todos.createdAt));
};

export const getTodosByUserId = async (userId: string) => {
  return await db
    .select()
    .from(todos)
    .where(eq(todos.userId, userId))
    .orderBy(asc(todos.createdAt));
};

export const getTagsByUserId = async (userId: string) => {
  return await db
    .select()
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(asc(tags.createdAt));
};

export const getTagById = async (userId: string, tagId: string) => {
  const [tag] = await db
    .select()
    .from(tags)
    .where(eq(tags.id, tagId))
    .limit(1);

  // Ensure the tag belongs to the user
  if (tag && tag.userId === userId) {
    return tag;
  }
  return null;
};

export const getTodoTags = async (userId: string, todoId: string) => {
  // Get all tags associated with a specific todo, ensuring the todo belongs to the user
  const todoTagsList = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
      userId: tags.userId,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
    })
    .from(todoTags)
    .innerJoin(todos, eq(todoTags.todoId, todos.id))
    .innerJoin(tags, eq(todoTags.tagId, tags.id))
    .where(and(eq(todos.id, todoId), eq(todos.userId, userId)));

  return todoTagsList;
};
