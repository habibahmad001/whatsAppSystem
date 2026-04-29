import "dotenv/config";
import { z } from "zod";

export const env = z
  .object({
    NODE_ENV: z.string().default("development").transform((val) => {
      const upper = val.toUpperCase();
      if (upper === "DEVELOPMENT" || upper === "PRODUCTION") {
        return upper;
      }
      return "DEVELOPMENT";
    }),
    KEY: z.string().default(""),
    PORT: z
      .string()
      .default("5001")
      .transform((e) => Number(e)),
    WEBHOOK_BASE_URL: z.string().optional(),
  })
  .parse(process.env);
