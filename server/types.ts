import { auth } from "./lib/auth";
import { todos, tags } from "./db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export type HonoEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
};

export type Todo = typeof todos.$inferSelect;
// export type TodoInsert = typeof todos.$inferInsert;
export const todoInsertSchema = createInsertSchema(todos)
  .pick({ title: true, description: true })
  .extend({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().max(1000).optional(),
  });
export type TodoInsert = z.infer<typeof todoInsertSchema>;

export const todoUpdateSchema = createUpdateSchema(todos)
  .pick({ title: true, description: true, completed: true, startAt: true, dueAt: true })
  .extend({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(1000).optional(),
    completed: z.boolean().optional(),
    startAt: z.coerce.date().nullable().optional(),
    dueAt: z.coerce.date().nullable().optional(),
  })
  .refine((data) => {
    return (
      data.title !== undefined ||
        data.description !== undefined ||
        data.completed !== undefined ||
        data.startAt !== undefined ||
        data.dueAt !== undefined,
      {
        message: "At least one field must be provided for update",
      }
    );
  });
export type TodoUpdate = z.infer<typeof todoUpdateSchema>;

export type Tag = typeof tags.$inferSelect;
export const tagInsertSchema = createInsertSchema(tags)
  .pick({ name: true, color: true })
  .extend({
    name: z.string().min(1, { message: "Tag name is required" }).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: "Color must be a valid hex code (e.g., #FFD400)" }).optional(),
  });
export type TagInsert = z.infer<typeof tagInsertSchema>;

export const tagUpdateSchema = createUpdateSchema(tags)
  .pick({ name: true, color: true })
  .extend({
    name: z.string().min(1).max(100).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: "Color must be a valid hex code (e.g., #FFD400)" }).optional(),
  })
  .refine((data) => {
    return data.name !== undefined || data.color !== undefined;
  }, {
    message: "At least one field (name or color) must be provided for update",
  });
export type TagUpdate = z.infer<typeof tagUpdateSchema>;
