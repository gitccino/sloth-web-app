import { Hono } from "hono";
import { getTodosByUserId } from "../db/queries";
import { authMiddleware } from "../middlewares/auth.middleware";
import { todoInsertSchema, type HonoEnv } from "../types";
import { createTodo } from "../db/mutation";
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
  .patch("/:id", async (c) => {
    const user = c.get("user");
    const todoId = c.req.param("id");
    // Create todoPatchSchema
    // Validate todoPatchSchema
    // Create patchTodo mutation function
    // Update todo
  });
