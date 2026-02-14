import { Hono } from "hono";
import { getTodosByUserId, getTodoTags } from "../db/queries";
import { authMiddleware } from "../middlewares/auth.middleware";
import { todoInsertSchema, todoUpdateSchema, type HonoEnv } from "../types";
import { createTodo, deleteTodo, updateTodo, addTagToTodo, removeTagFromTodo } from "../db/mutation";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const todos = new Hono<HonoEnv>()
  .use(authMiddleware)
  .get("/", async (c) => {
    const user = c.get("user");
    try {
      const todosList = await getTodosByUserId(user.id);
      // Fetch tags for each todo
      const todosWithTags = await Promise.all(
        todosList.map(async (todo) => {
          const tags = await getTodoTags(user.id, todo.id);
          return { ...todo, tags };
        })
      );
      return c.json(todosWithTags);
    } catch (error) {
      console.error("Error fetching todos:", error);
      return c.json({ error: "Failed to fetch todos" }, 500);
    }
  })
  .post("/", zValidator("json", todoInsertSchema), async (c) => {
    const user = c.get("user");
    const validatedTodo = c.req.valid("json");
    try {
      const createdTodo = await createTodo(user.id, validatedTodo);
      return c.json(
        {
          success: true,
          data: createdTodo,
          message: "Todo created successfully",
        },
        201,
      );
    } catch (error) {
      console.error("Error creating todo:", error);
      return c.json({ success: false, error: "Failed to create todo" }, 500);
    }
  })
  .patch("/:id", zValidator("json", todoUpdateSchema), async (c) => {
    const user = c.get("user");
    const todoId = c.req.param("id");
    const validatedTodo = c.req.valid("json");
    try {
      const updatedTodo = await updateTodo(user.id, todoId, validatedTodo);
      return c.json(
        {
          success: true,
          data: updatedTodo,
          message: "Todo updated successfully",
        },
        201,
      );
    } catch (error) {
      console.error("Error updating todo:", error);
      return c.json({ success: false, error: "Failed to update todo" }, 500);
    }
  })
  .delete("/:id", async (c) => {
    const user = c.get("user");
    const todoId = c.req.param("id");
    try {
      const deletedTodo = await deleteTodo(user.id, todoId);
      return c.json(
        {
          success: true,
          data: deletedTodo,
          message: "Todo deleted successfully",
        },
        201,
      );
    } catch (error) {
      console.error("Error deleting todo:", error);
      return c.json({ success: false, error: "Failed to delete todo" }, 500);
    }
  })
  .post("/:id/tags", zValidator("json", z.object({ tagId: z.string().uuid() })), async (c) => {
    const user = c.get("user");
    const todoId = c.req.param("id");
    const { tagId } = c.req.valid("json");
    try {
      const todoTag = await addTagToTodo(user.id, todoId, tagId);
      if (!todoTag) {
        return c.json(
          { success: false, error: "Tag already added to this todo" },
          409,
        );
      }
      return c.json(
        {
          success: true,
          data: todoTag,
          message: "Tag added to todo successfully",
        },
        201,
      );
    } catch (error: any) {
      console.error("Error adding tag to todo:", error);
      return c.json(
        { success: false, error: error.message || "Failed to add tag to todo" },
        500,
      );
    }
  })
  .delete("/:id/tags/:tagId", async (c) => {
    const user = c.get("user");
    const todoId = c.req.param("id");
    const tagId = c.req.param("tagId");
    try {
      const deletedTodoTag = await removeTagFromTodo(user.id, todoId, tagId);
      if (!deletedTodoTag) {
        return c.json(
          { success: false, error: "Tag not found on this todo" },
          404,
        );
      }
      return c.json(
        {
          success: true,
          data: deletedTodoTag,
          message: "Tag removed from todo successfully",
        },
        200,
      );
    } catch (error: any) {
      console.error("Error removing tag from todo:", error);
      return c.json(
        { success: false, error: error.message || "Failed to remove tag from todo" },
        500,
      );
    }
  });
