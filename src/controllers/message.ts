import { Hono } from "hono";
import { createKeyMiddleware } from "../middlewares/key.middleware";
import { requestValidator } from "../middlewares/validation.middleware";
import { z } from "zod";
import * as whatsapp from "wa-multi-session";
import { HTTPException } from "hono/http-exception";
import { saveMessageToDB } from "./dbService";

// Helper for retrying operations
const withRetry = async <T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(`Operation failed (attempt ${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

export const createMessageController = () => {
  const app = new Hono();

  const sendMessageSchema = z.object({
    session: z.string(),
    to: z.string(),
    text: z.string(),
    is_group: z.boolean().optional(),
  });

  app.post(
    "/send-text",
    createKeyMiddleware(),
    requestValidator("json", sendMessageSchema),
    async (c) => {
      const payload = c.req.valid("json");
      const isExist = whatsapp.getSession(payload.session);
      if (!isExist) {
        throw new HTTPException(400, {
          message: "Session does not exist",
        });
      }

      try {
        await whatsapp.sendTyping({
          sessionId: payload.session,
          to: payload.to,
          duration: Math.min(5000, payload.text.length * 100),
          isGroup: payload.is_group,
        });
      } catch (error) {
        console.warn("Failed to send typing indicator:", error);
      }

      const response = await withRetry(() =>
        whatsapp.sendTextMessage({
          sessionId: payload.session,
          to: payload.to,
          text: payload.text,
          isGroup: payload.is_group,
        })
      );

      // Save to DB
      await saveMessageToDB(
        payload.session,
        payload.to,
        true,
        "text",
        payload.text
      );

      return c.json({
        data: response,
      });
    }
  );

  /**
   * @deprecated
   * This endpoint is deprecated, use POST /send-text instead
   */
  app.get(
    "/send-text",
    createKeyMiddleware(),
    requestValidator("query", sendMessageSchema),
    async (c) => {
      const payload = c.req.valid("query");
      const isExist = whatsapp.getSession(payload.session);
      if (!isExist) {
        throw new HTTPException(400, {
          message: "Session does not exist",
        });
      }

      const response = await withRetry(() =>
        whatsapp.sendTextMessage({
          sessionId: payload.session,
          to: payload.to,
          text: payload.text,
        })
      );

      // Save to DB
      await saveMessageToDB(
        payload.session,
        payload.to,
        true,
        "text",
        payload.text
      );

      return c.json({
        data: response,
      });
    }
  );

  app.post(
    "/send-image",
    createKeyMiddleware(),
    requestValidator(
      "json",
      sendMessageSchema.merge(
        z.object({
          image_url: z.string(),
        })
      )
    ),
    async (c) => {
      const payload = c.req.valid("json");
      const isExist = whatsapp.getSession(payload.session);
      if (!isExist) {
        throw new HTTPException(400, {
          message: "Session does not exist",
        });
      }

      try {
        await whatsapp.sendTyping({
          sessionId: payload.session,
          to: payload.to,
          duration: Math.min(5000, payload.text.length * 100),
          isGroup: payload.is_group,
        });
      } catch (error) {
        console.warn("Failed to send typing indicator:", error);
      }

      const response = await withRetry(() =>
        whatsapp.sendImage({
          sessionId: payload.session,
          to: payload.to,
          text: payload.text,
          media: payload.image_url,
          isGroup: payload.is_group,
        })
      );

      // Save to DB
      await saveMessageToDB(
        payload.session,
        payload.to,
        true,
        "image",
        payload.text,
        payload.image_url
      );

      return c.json({
        data: response,
      });
    }
  );
  app.post(
    "/send-document",
    createKeyMiddleware(),
    requestValidator(
      "json",
      sendMessageSchema.merge(
        z.object({
          document_url: z.string(),
          document_name: z.string(),
        })
      )
    ),
    async (c) => {
      const payload = c.req.valid("json");
      const isExist = whatsapp.getSession(payload.session);
      if (!isExist) {
        throw new HTTPException(400, {
          message: "Session does not exist",
        });
      }

      try {
        await whatsapp.sendTyping({
          sessionId: payload.session,
          to: payload.to,
          duration: Math.min(5000, payload.text.length * 100),
          isGroup: payload.is_group,
        });
      } catch (error) {
        console.warn("Failed to send typing indicator:", error);
      }

      const response = await withRetry(() =>
        whatsapp.sendDocument({
          sessionId: payload.session,
          to: payload.to,
          text: payload.text,
          media: payload.document_url,
          filename: payload.document_name,
          isGroup: payload.is_group,
        })
      );

      // Save to DB
      await saveMessageToDB(
        payload.session,
        payload.to,
        true,
        "document",
        payload.text,
        payload.document_url
      );

      return c.json({
        data: response,
      });
    }
  );

  app.post(
    "/send-sticker",
    createKeyMiddleware(),
    requestValidator(
      "json",
      sendMessageSchema.merge(
        z.object({
          image_url: z.string(),
        })
      )
    ),
    async (c) => {
      const payload = c.req.valid("json");
      const isExist = whatsapp.getSession(payload.session);
      if (!isExist) {
        throw new HTTPException(400, {
          message: "Session does not exist",
        });
      }

      const response = await withRetry(() =>
        whatsapp.sendSticker({
          sessionId: payload.session,
          to: payload.to,
          media: payload.image_url,
          isGroup: payload.is_group,
        })
      );

      // Save to DB
      await saveMessageToDB(
        payload.session,
        payload.to,
        true,
        "sticker",
        null,
        payload.image_url
      );

      return c.json({
        data: response,
      });
    }
  );

  return app;
};
