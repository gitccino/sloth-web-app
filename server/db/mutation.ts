import { db } from "./db";
import type { TodoInsert, TodoUpdate, TagInsert, TagUpdate } from "../types";
import { todos, tags, todoTags } from "../db/schema";
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

export const createTag = async (userId: string, tag: TagInsert) => {
  const [createdTag] = await db
    .insert(tags)
    .values({ ...tag, userId })
    .returning();
  return createdTag;
};

export const updateTag = async (
  userId: string,
  id: string,
  tag: TagUpdate,
) => {
  const [updatedTag] = await db
    .update(tags)
    .set(tag)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .returning();
  return updatedTag;
};

export const deleteTag = async (userId: string, id: string) => {
  const [deletedTag] = await db
    .delete(tags)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .returning();
  return deletedTag;
};

export const addTagToTodo = async (
  userId: string,
  todoId: string,
  tagId: string,
) => {
  // Verify that both todo and tag belong to the user
  const [todo] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
    .limit(1);

  if (!todo) {
    throw new Error("Todo not found");
  }

  const [tag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);

  if (!tag) {
    throw new Error("Tag not found");
  }

  // Insert the relationship (will fail silently if already exists due to primary key constraint)
  try {
    const [todoTag] = await db
      .insert(todoTags)
      .values({ todoId, tagId })
      .returning();
    return todoTag;
  } catch (error: any) {
    // If it's a unique constraint violation, the tag is already added
    if (error?.code === "23505") {
      return null; // Already exists
    }
    throw error;
  }
};

export const removeTagFromTodo = async (
  userId: string,
  todoId: string,
  tagId: string,
) => {
  // Verify that both todo and tag belong to the user
  const [todo] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
    .limit(1);

  if (!todo) {
    throw new Error("Todo not found");
  }

  const [tag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);

  if (!tag) {
    throw new Error("Tag not found");
  }

  const [deletedTodoTag] = await db
    .delete(todoTags)
    .where(and(eq(todoTags.todoId, todoId), eq(todoTags.tagId, tagId)))
    .returning();
  return deletedTodoTag;
};
