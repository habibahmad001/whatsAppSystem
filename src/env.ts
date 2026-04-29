import "dotenv/config";
import { z } from "zod";

// Simple NODE_ENV handling - accept any value and normalize it
const getEnvMode = () => {
  const rawMode = process.env.NODE_ENV || "development";
  const upperMode = rawMode.toUpperCase();
  return (upperMode === "PRODUCTION") ? "PRODUCTION" : "DEVELOPMENT";
};

export const env = z
  .object({
    NODE_ENV: z.string().transform(() => getEnvMode()),
    KEY: z.string().default(""),
    PORT: z
      .string()
      .default("5001")
      .transform((e) => Number(e)),
    WEBHOOK_BASE_URL: z.string().optional(),
  })
  .parse(process.env);

console.log(`[Config] Environment: ${env.NODE_ENV}`);
