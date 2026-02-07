import { db } from "./db";
import type { TodoInsert, TodoUpdate } from "../types";
import { todos } from "../db/schema";
import { and, eq } from "drizzle-orm";

export const createTodo = async (userId: string, todo: TodoInsert) => {
  const [createdTodo] = await db
    .insert(todos)
    .values({ ...todo, userId })
    .returning();
  return createdTodo;
};

export const updateTodo = async (
  userId: string,
  id: string,
  todo: TodoUpdate,
) => {
  const [updatedTodo] = await db
    .update(todos)
    .set(todo)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();
  return updatedTodo;
};

export const deleteTodo = async (userId: string, id: string) => {
  const [deletedTodo] = await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();
  return deletedTodo;
};
