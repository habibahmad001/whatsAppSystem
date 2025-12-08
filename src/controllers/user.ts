import { Hono } from "hono";
import { z } from "zod";
import { requestValidator } from "../middlewares/validation.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import * as bcrypt from "bcryptjs";
import * as mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "mywhatsapp",
});

export const createUserController = () => {
    const app = new Hono();

    // Protect all routes with admin middleware
    app.use("*", authMiddleware("admin"));

    const createUserSchema = z.object({
        username: z.string(),
        password: z.string(),
        role: z.enum(["admin", "user"]).optional(),
    });

    app.post(
        "/",
        requestValidator("json", createUserSchema),
        async (c) => {
            const { username, password, role } = c.req.valid("json");
            const hashedPassword = await bcrypt.hash(password, 10);
            const userRole = role || "user";

            try {
                await pool.execute(
                    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                    [username, hashedPassword, userRole]
                );
                return c.json({ message: "User created successfully" });
            } catch (error: any) {
                if (error.code === "ER_DUP_ENTRY") {
                    return c.json({ message: "Username already exists" }, 400);
                }
                throw error;
            }
        }
    );

    app.get("/", async (c) => {
        const [rows]: any = await pool.execute(
            "SELECT id, username, role, created_at FROM users"
        );
        return c.json({ data: rows });
    });

    app.delete("/:id", async (c) => {
        const id = c.req.param("id");
        await pool.execute("DELETE FROM users WHERE id = ?", [id]);
        return c.json({ message: "User deleted successfully" });
    });

    return app;
};
