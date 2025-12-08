import { Hono } from "hono";
import { createKeyMiddleware } from "../middlewares/key.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getMessagesFromDB, getChatThreadsFromDB } from "./dbService";

export const createHistoryController = () => {
    const app = new Hono();

    // Protect all routes
    app.use("*", authMiddleware());

    app.get("/:session/:phone", createKeyMiddleware(), async (c) => {
        const session = c.req.param("session");
        const phone = c.req.param("phone");
        const limit = parseInt(c.req.query("limit") || "50");

        const messages = await getMessagesFromDB(session, phone, limit);

        return c.json({
            data: messages,
        });
    });

    app.get("/:session/threads", createKeyMiddleware(), async (c) => {
        const session = c.req.param("session");
        const threads = await getChatThreadsFromDB(session);
        return c.json({
            data: threads,
        });
    });

    return app;
};
