import * as whatsapp from "wa-multi-session";
import { Hono } from "hono";
import { requestValidator } from "../middlewares/validation.middleware";
import { z } from "zod";
import { createKeyMiddleware } from "../middlewares/key.middleware";
import { toDataURL } from "qrcode";
import { HTTPException } from "hono/http-exception";
import { deleteSessionFromDB, getSessionFromDB, saveSessionToDB } from "./dbService";

export const createSessionController = () => {
  const app = new Hono();

  app.get("/", createKeyMiddleware(), async (c) => {
    return c.json({
      data: whatsapp.getAllSession(),
    });
  });

  const startSessionSchema = z.object({
    session: z.string(),
  });

  app.post(
    "/start",
    createKeyMiddleware(),
    requestValidator("json", startSessionSchema),
    async (c) => {
      const payload = c.req.valid("json");

      // Check memory first
      if (whatsapp.getSession(payload.session)) {
        return c.json({
          data: {
            message: "Session already connected",
          },
        });
      }

      // Check DB first
      const existingSession = await getSessionFromDB(payload.session);
      if (existingSession) {
        console.log(`[Session] Found existing session '${payload.session}' in DB. Loading...`);
        try {
          // Force delete just in case it's in a zombie state
          await whatsapp.deleteSession(payload.session);
          await whatsapp.startSession(payload.session, {
            sessionData: typeof existingSession.session_data === 'string'
              ? JSON.parse(existingSession.session_data)
              : existingSession.session_data,
          } as any);
          return c.json({
            data: {
              message: "Session loaded from database",
            },
          });
        } catch (error) {
          console.error("[Session] Failed to load session from DB:", error);
          // If loading fails, maybe we should delete it? For now, let's just proceed to try new session or error.
        }
      }

      const qr = await new Promise<string | null>(async (resolve) => {
        console.log("Starting session:", payload.session);

        try {
          await whatsapp.startSession(payload.session, {
            onConnected: async () => {
              console.log("✅ Connected");
              const session = whatsapp.getSession(payload.session);
              const sessionData = session?.authState.creds;
              // Save to DB
              try {
                await saveSessionToDB(payload.session, sessionData);
              } catch (dbErr) {
                console.error("Failed to save session to DB:", dbErr);
              }
              resolve(null);
            },
            onQRUpdated(qr: string) {
              console.log("📱 QR:", qr);
              resolve(qr);
            },
          } as any);
        } catch (err) {
          console.error("❌ startSession error:", err);
          resolve(null); // or rethrow if needed
        }


        console.log("👀 Waiting for QR code or connection...");
      });


      if (qr) {
        return c.json({
          qr: qr,
        });
      }

      return c.json({
        data: {
          message: "Connected",
        },
      });
    }
  );
  app.get(
    "/start",
    createKeyMiddleware(),
    requestValidator("query", startSessionSchema),
    async (c) => {
      const payload = c.req.valid("query");

      // Check memory first
      if (whatsapp.getSession(payload.session)) {
        return c.json({
          data: {
            message: "Session already connected",
          },
        });
      }

      // Check DB first
      const existingSession = await getSessionFromDB(payload.session);
      if (existingSession) {
        console.log(`[Session] Found existing session '${payload.session}' in DB. Loading...`);
        try {
          // Force delete just in case it's in a zombie state
          await whatsapp.deleteSession(payload.session);
          await whatsapp.startSession(payload.session, {
            sessionData: typeof existingSession.session_data === 'string'
              ? JSON.parse(existingSession.session_data)
              : existingSession.session_data,
          } as any);
          return c.json({
            data: {
              message: "Session loaded from database",
            },
          });
        } catch (error) {
          console.error("[Session] Failed to load session from DB:", error);
        }
      }

      const isExist = whatsapp.getSession(payload.session);
      if (isExist) {
        console.log("⚠️ Session exists in memory. Deleting...");
        await whatsapp.deleteSession(payload.session);
      }


      const qr = await new Promise<string | null>(async (r) => {
        await whatsapp.startSession(payload.session, {
          onConnected: async () => {
            // Save to DB
            try {
              const session = whatsapp.getSession(payload.session);
              const sessionData = session?.authState.creds;
              await saveSessionToDB(payload.session, sessionData);
            } catch (dbErr) {
              console.error("Failed to save session to DB:", dbErr);
            }
            r(null);
          },
          onQRUpdated(qr: string) {
            r(qr);
          },
        } as any);
      });

      if (qr) {
        return c.render(`
            <div id="qrcode"></div>

            <script type="text/javascript">
                let qr = '${await toDataURL(qr)}'
                let image = new Image()
                image.src = qr
                document.body.appendChild(image)
            </script>
            `);
      }

      return c.json({
        data: {
          message: "Connected",
        },
      });
    }
  );

  app.all("/logout", createKeyMiddleware(), async (c) => {
    let sessionName = c.req.query("session");
    if (!sessionName) {
      try {
        const body = await c.req.json();
        sessionName = body.session;
      } catch (e) {
        // Ignore JSON parse error
      }
    }
    sessionName = sessionName || "";

    await whatsapp.deleteSession(sessionName);
    await deleteSessionFromDB(sessionName);

    return c.json({
      data: "success",
    });
  });

  return app;
};
