import { asc, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { todos } from "./schema";

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
