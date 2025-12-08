import { initUsersTable, initContactsTable, initMessagesTable } from "../controllers/dbService";

(async () => {
    console.log("Starting database migration...");
    try {
        await initUsersTable();
        await initContactsTable();
        await initMessagesTable();
        console.log("Database migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
})();
