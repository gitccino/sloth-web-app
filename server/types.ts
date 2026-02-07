import { auth } from "./lib/auth";
import { todos } from "./db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export type HonoEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
};

// export type TodoInsert = typeof todos.$inferInsert;
export const todoInsertSchema = createInsertSchema(todos)
  .pick({ title: true, description: true })
  .extend({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().max(1000).optional(),
  });
export type TodoInsert = z.infer<typeof todoInsertSchema>;

export const todoUpdateSchema = createUpdateSchema(todos)
  .pick({ title: true, description: true, completed: true })
  .extend({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(1000).optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => {
    return (
      data.title !== undefined ||
        data.description !== undefined ||
        data.completed !== undefined,
      {
        message: "At least one field must be provided for update",
      }
    );
  });
export type TodoUpdate = z.infer<typeof todoUpdateSchema>;
