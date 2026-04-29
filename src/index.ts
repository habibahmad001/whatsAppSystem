import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import moment from "moment";
import { globalErrorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notfound.middleware";
import { serve } from "@hono/node-server";
import { env } from "./env";
import { createSessionController } from "./controllers/session";
import * as whastapp from "wa-multi-session";
import { createMessageController } from "./controllers/message";
import { CreateWebhookProps } from "./webhooks";
import { createWebhookMessage } from "./webhooks/message";
import { createWebhookSession } from "./webhooks/session";
import { createProfileController } from "./controllers/profile";
import { serveStatic } from "@hono/node-server/serve-static";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import * as fs from "fs";
import * as path from "path";

const app = new Hono();

app.use(
  logger((...params) => {
    params.map((e) => console.log(`${moment().toISOString()} | ${e}`));
  })
);
app.use(cors());

app.onError(globalErrorMiddleware);
app.notFound(notFoundMiddleware);

/**
 * serve media message static files
 */
app.use(
  "/media/*",
  serveStatic({
    root: "./",
  })
);

/**
 * session routes
 */
app.route("/session", createSessionController());
/**
 * message routes
 */
app.route("/message", createMessageController());
/**
 * profile routes
 */
app.route("/profile", createProfileController());

/**
 * auth routes
 */
import { createAuthController } from "./controllers/auth";
app.route("/auth", createAuthController());

/**
 * user routes
 */
import { createUserController } from "./controllers/user";
app.route("/users", createUserController());

/**
 * contact routes
 */
import { createContactController } from "./controllers/contact";
app.route("/contacts", createContactController());

/**
 * history routes
 */
import { createHistoryController } from "./controllers/history";
app.route("/history", createHistoryController());

/**
 * admin routes
 */
import { createAdminController } from "./controllers/admin";
app.route("/admin", createAdminController());

/**
 * migration routes
 */
import { createMigrateController } from "./controllers/migrate";
app.route("/migrate", createMigrateController());

const port = env.PORT;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

whastapp.onConnected((session) => {
  console.log(`session: '${session}' connected`);
});

// Implement Webhook
if (env.WEBHOOK_BASE_URL) {
  const webhookProps: CreateWebhookProps = {
    baseUrl: env.WEBHOOK_BASE_URL,
  };

  // message webhook
  whastapp.onMessageReceived(createWebhookMessage(webhookProps));

  // session webhook
  const webhookSession = createWebhookSession(webhookProps);

  whastapp.onConnected((session) => {
    console.log(`session: '${session}' connected`);
    webhookSession({ session, status: "connected" });
  });
  whastapp.onConnecting((session) => {
    console.log(`session: '${session}' connecting`);
    webhookSession({ session, status: "connecting" });
  });
  whastapp.onDisconnected((session) => {
    console.log(`session: '${session}' disconnected`);
    webhookSession({ session, status: "disconnected" });
  });
}
// End Implement Webhook

// Restore sessions from DB
import { getAllSessionsFromDB, initSessionsTable, initUsersTable, initContactsTable, initMessagesTable, saveMessageToDB } from "./controllers/dbService";

(async () => {
  try {
    await initSessionsTable();
    await initUsersTable();
    await initContactsTable();
    await initMessagesTable();
    const sessions = await getAllSessionsFromDB();
    for (const session of sessions) {
      console.log(`[Startup] Restoring session: ${session.session_name}`);
      await whastapp.startSession(session.session_name, {
        sessionData: typeof session.session_data === 'string'
          ? JSON.parse(session.session_data)
          : session.session_data,
        onConnected: async () => {
          console.log(`[Startup] Session '${session.session_name}' connected`);
        },
        onQRUpdated: (qr: string) => {
          console.log(`[Startup] Session '${session.session_name}' QR updated`);
        },
        onMessageReceived: async (msg: any) => {
          // Save incoming message
          if (!msg.key.fromMe) {
            const content = msg.message?.conversation ||
              msg.message?.extendedTextMessage?.text ||
              msg.message?.imageMessage?.caption ||
              msg.message?.videoMessage?.caption ||
              "Media Message";

            const messageType = Object.keys(msg.message || {})[0];
            const type = msg.message?.imageMessage ? 'image' :
              msg.message?.videoMessage ? 'video' :
                msg.message?.documentMessage ? 'document' :
                  msg.message?.stickerMessage ? 'sticker' : 'text';

            let mediaUrl = null;

            // Handle Media Download
            if (['image', 'video', 'document', 'sticker'].includes(type)) {
              try {
                const buffer = await downloadMediaMessage(
                  msg,
                  'buffer',
                  {},
                  {
                    logger: console as any,
                    reuploadRequest: (msg: any) => new Promise((resolve) => resolve(msg))
                  }
                );

                if (buffer) {
                  const ext = type === 'image' ? 'jpg' :
                    type === 'video' ? 'mp4' :
                      type === 'sticker' ? 'webp' :
                        'bin'; // Default for document if unknown

                  const fileName = `${Date.now()}_${msg.key.id}.${ext}`;
                  const filePath = path.join("media", fileName);

                  // Ensure media directory exists
                  if (!fs.existsSync("media")) {
                    fs.mkdirSync("media");
                  }

                  await fs.promises.writeFile(filePath, buffer);
                  mediaUrl = `/media/${fileName}`;
                  console.log(`[Media] Saved to ${mediaUrl}`);
                }
              } catch (err) {
                console.error("[Media] Failed to download media:", err);
              }
            }

            await saveMessageToDB(
              session.session_name,
              msg.key.remoteJid || '',
              false,
              type,
              content,
              mediaUrl
            );
          }
        }
      } as any);
    }
  } catch (error) {
    console.error("[Startup] Failed to restore sessions:", error);
  }
})();
