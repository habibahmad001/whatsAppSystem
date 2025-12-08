import { Hono } from "hono";
import { z } from "zod";
import { requestValidator } from "../middlewares/validation.middleware";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const { sign } = jwt;
import * as mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "mywhatsapp",
});

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const createAuthController = () => {
    const app = new Hono();

    const loginSchema = z.object({
        username: z.string(),
        password: z.string(),
    });

    app.post(
        "/login",
        requestValidator("json", loginSchema),
        async (c) => {
            const { username, password } = c.req.valid("json");

            const [rows]: any = await pool.execute(
                "SELECT * FROM users WHERE username = ?",
                [username]
            );

            const user = rows[0];
            if (!user) {
                return c.json({ message: "Invalid credentials" }, 401);
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return c.json({ message: "Invalid credentials" }, 401);
            }

            const token = sign(
                { id: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: "1d" }
            );

            return c.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                },
            });
        }
    );

    return app;
};
