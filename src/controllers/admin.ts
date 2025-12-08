import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { truncateTable } from "./dbService";
import { authMiddleware } from "../middlewares/auth.middleware";

export const createAdminController = () => {
    const app = new Hono();

    // Protect all admin routes
    app.use("*", authMiddleware("admin"));

    app.post(
        "/truncate",
        zValidator(
            "json",
            z.object({
                table: z.enum(["contacts", "messages", "sessions"]),
            })
        ),
        async (c) => {
            const { table } = c.req.valid("json");
            try {
                await truncateTable(table);
                return c.json({
                    success: true,
                    message: `Table '${table}' truncated successfully`,
                });
            } catch (error: any) {
                return c.json(
                    {
                        success: false,
                        message: error.message || "Failed to truncate table",
                    },
                    500
                );
            }
        }
    );

    return app;
};
