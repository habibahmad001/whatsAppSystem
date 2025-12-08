import * as mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "mywhatsapp",
});

async function updateEmails() {
    console.log("Starting email update...");

    try {
        const [rows]: any = await pool.execute("SELECT id, first_name, last_name FROM contacts");

        let updated = 0;
        let failed = 0;

        for (const contact of rows) {
            // Sanitize names
            const cleanFirst = contact.first_name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanLast = contact.last_name.toLowerCase().replace(/[^a-z0-9]/g, '_');

            // Remove leading/trailing underscores from last name if any
            const finalLast = cleanLast.replace(/^_+|_+$/g, '');

            const email = `${cleanFirst}_${finalLast}@gmail.com`;

            try {
                await pool.execute(
                    "UPDATE contacts SET email = ? WHERE id = ?",
                    [email, contact.id]
                );
                console.log(`Updated: ${contact.first_name} ${contact.last_name} -> ${email}`);
                updated++;
            } catch (error: any) {
                console.error(`Failed to update ${contact.first_name}:`, error.message);
                failed++;
            }
        }

        console.log(`\nUpdate complete!`);
        console.log(`Updated: ${updated}`);
        console.log(`Failed: ${failed}`);
    } catch (error) {
        console.error("Script failed:", error);
    } finally {
        process.exit(0);
    }
}

updateEmails();
