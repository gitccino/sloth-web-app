import { Hono } from "hono";
import { getTodosByUserId } from "../db/queries";
import { authMiddleware } from "../middlewares/auth.middleware";
import { todoInsertSchema, todoUpdateSchema, type HonoEnv } from "../types";
import { createTodo, deleteTodo, updateTodo } from "../db/mutation";
import { zValidator } from "@hono/zod-validator";
import { success } from "zod";

export const todos = new Hono<HonoEnv>()
  .use(authMiddleware)
  .get("/", async (c) => {
    const user = c.get("user");
    try {
      const todos = await getTodosByUserId(user.id);
      return c.json(todos);
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
  });
