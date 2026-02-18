/// <reference types="bun-types" />
import { Hono } from "hono";
import type { HonoEnv } from "../types";
import { authMiddleware } from "../middlewares/auth.middleware";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "crypto";
const sharp = require("sharp") as typeof import("sharp");

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const missing = [
  !bucketName && "BUCKET_NAME",
  !bucketRegion && "BUCKET_REGION",
  !accessKey && "ACCESS_KEY",
  !secretAccessKey && "SECRET_ACCESS_KEY",
].filter(Boolean);

if (missing.length > 0) {
  throw new Error(
    `Missing required S3 environment variables: ${missing.join(", ")}. ` +
      `Add them to your .env file or environment.`
  );
}

const s3 = new S3Client({
  region: bucketRegion!,
  credentials: {
    accessKeyId: accessKey!,
    secretAccessKey: secretAccessKey!,
  },
});

// Read a file from filepath and convert to Buffer
async function fileToBuffer(filePath: string): Promise<Buffer> {
  const file = Bun.file(filePath);
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Resize an image buffer using sharp
interface ResizeOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100, default 100
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

async function resizeImage(
  buffer: Buffer,
  options: ResizeOptions = {},
): Promise<Buffer> {
  const { width, height, quality = 100, fit = "cover" } = options;

  let pipeline = sharp(buffer);

  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit,
      withoutEnlargement: true, // Don't upscale smaller images
    });
  }

  // Optimize and compress based on format
  const metadata = await sharp(buffer).metadata();

  if (metadata.format === "jpeg" || metadata.format === "jpg") {
    pipeline = pipeline.jpeg({ quality });
  } else if (metadata.format === "png") {
    pipeline = pipeline.png({ quality: Math.round(quality / 10) * 10 }); // PNG uses 0-9 scale roughly
  } else if (metadata.format === "webp") {
    pipeline = pipeline.webp({ quality });
  }

  return pipeline.toBuffer();
}

// Put an object in the S3 bucket
async function uploadToS3(key: string, body: Buffer) {
  const params = {
    Bucket: bucketName,
    Key: key, // File name in the bucket
    Body: body, // File content as a Buffer
    // ContentType: Set the content type as needed
  };
  const command = new PutObjectCommand(params);

  try {
    const response = await s3.send(command);
    console.log("File uploaded successfully:", response);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
}

function generateFilename(originalName: string, userId: string) {
  const ext = originalName.split(".").pop();
  const timestamp = Date.now();
  const hash = createHash("sha256")
    .update(`${userId}-${timestamp}-${originalName}`)
    .digest("hex")
    .slice(0, 12); // short hash

  return `${timestamp}-${hash}.${ext}`;
  // → "1708123456789-a3f9c12b8e1d.jpg"
}

function extractFilenameFromPath(filePath: string) {
  const lastSlash = filePath.lastIndexOf("/");
  const lastBackslash = filePath.lastIndexOf("\\");
  const separatorIndex = lastSlash > lastBackslash ? lastSlash : lastBackslash;

  return separatorIndex === -1 ? filePath : filePath.slice(separatorIndex + 1);
}

export const infra = new Hono<HonoEnv>()
  .use(authMiddleware)
  .post("/", async (c) => {
    // Testing S3 upload with a sample file
    const user = c.get("user");
    const filePath = "./server/assets/humation.png"; // Just for testing purpose
    try {
      const originalName = extractFilenameFromPath(filePath);
      const key = generateFilename(originalName, user.id);
      const imageBuffer = await fileToBuffer(filePath);
      const resizedBuffer = await resizeImage(imageBuffer, {
        width: 250,
        height: 250,
      });
      await uploadToS3(key, resizedBuffer);
    } catch (error) {
      console.error("Error processing file:", error);
      return c.json({ success: false, error: "Failed to process file" }, 500);
    }

    return c.json(
      { success: true, message: "File uploaded successfully" },
      200,
    );
  });
