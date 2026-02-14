import { Hono } from "hono";
import { getTagsByUserId, getTagById } from "../db/queries";
import { authMiddleware } from "../middlewares/auth.middleware";
import { tagInsertSchema, tagUpdateSchema, type HonoEnv } from "../types";
import { createTag, updateTag, deleteTag } from "../db/mutation";
import { zValidator } from "@hono/zod-validator";

export const tags = new Hono<HonoEnv>()
  .use(authMiddleware)
  .get("/", async (c) => {
    const user = c.get("user");
    try {
      const userTags = await getTagsByUserId(user.id);
      return c.json(userTags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      return c.json({ error: "Failed to fetch tags" }, 500);
    }
  })
  .get("/:id", async (c) => {
    const user = c.get("user");
    const tagId = c.req.param("id");
    try {
      const tag = await getTagById(user.id, tagId);
      if (!tag) {
        return c.json({ error: "Tag not found" }, 404);
      }
      return c.json(tag);
    } catch (error) {
      console.error("Error fetching tag:", error);
      return c.json({ error: "Failed to fetch tag" }, 500);
    }
  })
  .post("/", zValidator("json", tagInsertSchema), async (c) => {
    const user = c.get("user");
    const validatedTag = c.req.valid("json");
    try {
      const createdTag = await createTag(user.id, validatedTag);
      return c.json(
        {
          success: true,
          data: createdTag,
          message: "Tag created successfully",
        },
        201,
      );
    } catch (error: any) {
      console.error("Error creating tag:", error);
      // Handle unique constraint violation (duplicate tag name)
      if (error?.code === "23505") {
        return c.json(
          { success: false, error: "Tag with this name already exists" },
          409,
        );
      }
      return c.json({ success: false, error: "Failed to create tag" }, 500);
    }
  })
  .patch("/:id", zValidator("json", tagUpdateSchema), async (c) => {
    const user = c.get("user");
    const tagId = c.req.param("id");
    const validatedTag = c.req.valid("json");
    try {
      const updatedTag = await updateTag(user.id, tagId, validatedTag);
      if (!updatedTag) {
        return c.json({ success: false, error: "Tag not found" }, 404);
      }
      return c.json(
        {
          success: true,
          data: updatedTag,
          message: "Tag updated successfully",
        },
        200,
      );
    } catch (error: any) {
      console.error("Error updating tag:", error);
      // Handle unique constraint violation (duplicate tag name)
      if (error?.code === "23505") {
        return c.json(
          { success: false, error: "Tag with this name already exists" },
          409,
        );
      }
      return c.json({ success: false, error: "Failed to update tag" }, 500);
    }
  })
  .delete("/:id", async (c) => {
    const user = c.get("user");
    const tagId = c.req.param("id");
    try {
      const deletedTag = await deleteTag(user.id, tagId);
      if (!deletedTag) {
        return c.json({ success: false, error: "Tag not found" }, 404);
      }
      return c.json(
        {
          success: true,
          data: deletedTag,
          message: "Tag deleted successfully",
        },
        200,
      );
    } catch (error) {
      console.error("Error deleting tag:", error);
      return c.json({ success: false, error: "Failed to delete tag" }, 500);
    }
  });
