import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
const { verify } = jwt;
import { env } from "../env";
import { HTTPException } from "hono/http-exception";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const authMiddleware = (role?: "admin" | "user") => {
    return async (c: Context, next: Next) => {
        const authHeader = c.req.header("Authorization");
        if (!authHeader) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new HTTPException(401, { message: "Unauthorized" });
        }

        try {
            const decoded = verify(token, JWT_SECRET) as any;
            c.set("user", decoded);

            if (role && decoded.role !== role && decoded.role !== "admin") {
                throw new HTTPException(403, { message: "Forbidden" });
            }

            await next();
        } catch (error) {
            throw new HTTPException(401, { message: "Invalid Token" });
        }
    };
};
