import * as whatsapp from "wa-multi-session";
import { Hono } from "hono";
import { requestValidator } from "../middlewares/validation.middleware";
import { z } from "zod";
import { createKeyMiddleware } from "../middlewares/key.middleware";
import { toDataURL } from "qrcode";
import { HTTPException } from "hono/http-exception";
import { getSessionFromDB, saveSessionToDB, deleteSessionFromDB } from "./dbService";

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

      const existingSession = await getSessionFromDB(payload.session);

      if (existingSession) {
        console.log("Session already exists, loading from DB...");
        await whatsapp.startSession(payload.session, {
          sessionData: JSON.parse(existingSession.session_data),
        });

        return c.json({ message: "Session loaded from DB" });
      }

      let sessionCredentials: any = null;

      const qr = await new Promise<string | null>((resolve) => {
        whatsapp.startSession(payload.session, {
          onConnected(session) {
            sessionCredentials = session; // session has credentials
            resolve(null);
          },
          onQRUpdated(qr) {
            resolve(qr);
          },
        });
      });

      if (sessionCredentials) {
        // Example: set userId as 1, or extract it from your middleware later
        const userId = 1; // hardcoded now, later dynamic if needed
        await saveSessionToDB(payload.session, sessionCredentials, userId);
      }

      if (qr) {
        return c.json({ qr });
      }

      return c.json({ message: "Connected" });
    }
  );


  app.get(
  "/start",
  createKeyMiddleware(),
  requestValidator("query", startSessionSchema),

  async (c) => {
    const payload = c.req.valid("query");

    console.log("[Session] Received request to start session:", payload.session);

    const isExist = whatsapp.getSession(payload.session);
    if (isExist) {
      console.log("[Session] Session already exists, trying to extract credentials...");
      const sessionData = await isExist.getSession(); // Try to get auth data

      if (sessionData) {
        console.log("[Session] Extracted session credentials:", sessionData);

        const userId = 1;
        await saveSessionToDB(payload.session, sessionData, userId);

        return c.json({ message: "Session already saved to DB." });
      } else {
        throw new HTTPException(400, {
          message: "Session exists but no credentials available.",
        });
      }
    }


    let sessionData: any = null;

    const qr = await new Promise<string | null>(async (resolve, reject) => {
  console.log("[Session] Trying to start session...");

  let timeout = setTimeout(() => {
    console.error("[Session] Timeout: No QR scan detected!");
    reject(new Error("Timeout waiting for QR scan."));
  }, 120000); // 2 minutes timeout

  let whatsappsession = await whatsapp.startSession(payload.session, {
    onConnected(session) {
      console.log("[Session] Connected successfully:", session);
      clearTimeout(timeout);
      sessionData = session;
      const userId = 1; // Hardcoded, later you can make dynamic
      try {
        saveSessionToDB(payload.session, sessionData, userId);
        saveSessionToDB(payload.session, whatsappsession, userId);
        console.log("[Session] Saved session to database successfully.");
      } catch (err) {
        console.error("[DB Error] Failed to save session:", err);
      }
      resolve(null);
    },
    onQRUpdated(qr) {
      console.log("[Session] QR updated received:", qr);
      // Note: don't clear timeout here
      resolve(qr);
    },
    onDisconnected(reason) {
      console.error("[Session] Disconnected:", reason);
      clearTimeout(timeout);
      reject(new Error("Disconnected: " + reason));
    },
    onError(error) {
      console.error("[Session] Session error:", error);
      clearTimeout(timeout);
      reject(error);
    },
  });
});
 


    if (sessionData) {
      console.log("[Session] Final session object after connection:", sessionData);

      const userId = 1; // Hardcoded, later you can make dynamic
      try {
        await saveSessionToDB(payload.session, sessionData, userId);
        console.log("[Session] Saved session to database successfully.");
      } catch (err) {
        console.error("[DB Error] Failed to save session:", err);
      }

      return c.json({
        message: "Connected",
      });
    }

    if (qr) {
      const qrDataURL = await toDataURL(qr);

      return c.render(`
          <div id="qrcode"></div>

          <script type="text/javascript">
              let qr = '${qrDataURL}';
              let image = new Image();
              image.src = qr;
              document.body.appendChild(image);
          </script>
      `);
    }

    return c.json({
      data: {
        message: "Waiting for connection...",
      },
    });
  }
);



  app.all("/logout", createKeyMiddleware(), async (c) => {
    const sessionName = c.req.query("session") || (await c.req.json())?.session;

    if (!sessionName) {
      throw new HTTPException(400, { message: "Session name is required" });
    }

    await whatsapp.deleteSession(sessionName);
    await deleteSessionFromDB(sessionName);

    return c.json({ message: "Logged out" });
  });

  return app;
};
