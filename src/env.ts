import "dotenv/config";
import { z } from "zod";

// Normalize NODE_ENV before validation
const normalizedEnv = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV?.toUpperCase() || "DEVELOPMENT",
};

export const env = z
  .object({
    NODE_ENV: z.enum(["DEVELOPMENT", "PRODUCTION"]).default("DEVELOPMENT"),
    KEY: z.string().default(""),
    PORT: z
      .string()
      .default("5001")
      .transform((e) => Number(e)),
    WEBHOOK_BASE_URL: z.string().optional(),
  })
  .parse(normalizedEnv);

console.log(`[Config] Environment: ${env.NODE_ENV}`);
