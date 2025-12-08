import { Hono } from "hono";
import { z } from "zod";
import { requestValidator } from "../middlewares/validation.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import * as mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "mywhatsapp",
});

export const createContactController = () => {
    const app = new Hono();

    // Protect all routes
    app.use("*", authMiddleware());

    const createContactSchema = z.object({
        first_name: z.string(),
        last_name: z.string(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string(),
    });

    const updateContactSchema = z.object({
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
    });

    const bulkDeleteSchema = z.object({
        ids: z.array(z.number()),
    });

    // Create Contact
    app.post(
        "/",
        requestValidator("json", createContactSchema),
        async (c) => {
            const { first_name, last_name, email, phone } = c.req.valid("json");
            try {
                await pool.execute(
                    "INSERT INTO contacts (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)",
                    [first_name, last_name, email || null, phone]
                );
                return c.json({ message: "Contact created successfully" });
            } catch (error: any) {
                if (error.code === "ER_DUP_ENTRY") {
                    return c.json({ message: "Phone or Email already exists" }, 400);
                }
                throw error;
            }
        }
    );

    // Get All Contacts with Pagination
    app.get("/", async (c) => {
        const page = parseInt(c.req.query("page") || "1");
        const limit = parseInt(c.req.query("limit") || "100");
        const offset = (page - 1) * limit;

        const [countResult]: any = await pool.execute("SELECT COUNT(*) as total FROM contacts");
        const total = countResult[0].total;

        const [rows]: any = await pool.execute(
            "SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [limit.toString(), offset.toString()]
        );

        return c.json({
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    });

    // Update Contact
    app.put(
        "/:id",
        requestValidator("json", updateContactSchema),
        async (c) => {
            const id = c.req.param("id");
            const { first_name, last_name, email, phone } = c.req.valid("json");

            const updates = [];
            const values = [];
            if (first_name) {
                updates.push("first_name = ?");
                values.push(first_name);
            }
            if (last_name) {
                updates.push("last_name = ?");
                values.push(last_name);
            }
            if (email !== undefined) {
                updates.push("email = ?");
                values.push(email || null);
            }
            if (phone) {
                updates.push("phone = ?");
                values.push(phone);
            }

            if (updates.length === 0) {
                return c.json({ message: "No updates provided" }, 400);
            }

            values.push(id);
            await pool.execute(
                `UPDATE contacts SET ${updates.join(", ")} WHERE id = ?`,
                values
            );
            return c.json({ message: "Contact updated successfully" });
        }
    );

    // Delete Contact
    app.delete("/:id", async (c) => {
        const id = c.req.param("id");
        await pool.execute("DELETE FROM contacts WHERE id = ?", [id]);
        return c.json({ message: "Contact deleted successfully" });
    });

    // Bulk Delete
    app.post(
        "/bulk-delete",
        requestValidator("json", bulkDeleteSchema),
        async (c) => {
            const { ids } = c.req.valid("json");
            if (ids.length === 0) {
                return c.json({ message: "No IDs provided" }, 400);
            }

            const placeholders = ids.map(() => "?").join(",");
            await pool.execute(
                `DELETE FROM contacts WHERE id IN (${placeholders})`,
                ids
            );
            return c.json({ message: "Contacts deleted successfully" });
        }
    );

    return app;
};
