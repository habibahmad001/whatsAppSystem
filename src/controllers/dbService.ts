import * as mysql from "mysql2/promise";
import * as bcrypt from "bcryptjs";
import { env } from "../env";

// Create connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "mywhatsapp",
});

console.log("[DB] Pool created successfully");

// Save session to DB
export async function saveSessionToDB(sessionName: string, sessionData: any, userId: number | null = null) {
  try {
    console.log(`[DB] Saving session: ${sessionName}`);

    const sessionDataJson = JSON.stringify(sessionData || {});
    const validUserId = userId === undefined ? null : userId;

    const sql = `
      INSERT INTO sessions (session_name, session_data, created_by, updated_by)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        session_data = VALUES(session_data),
        updated_by = VALUES(updated_by)
    `;

    const [result] = await pool.execute(sql, [sessionName, sessionDataJson, validUserId, validUserId]);

    console.log("[DB] Session saved successfully", result);
  } catch (error) {
    console.error("[DB] Error saving session:", error);
    throw error;
  }
}

// Get session from DB
export async function getSessionFromDB(sessionName: string) {
  try {
    console.log(`[DB] Fetching session: ${sessionName}`);

    const sql = "SELECT * FROM sessions WHERE session_name = ?";

    const [rows]: any = await pool.execute(sql, [sessionName]);

    console.log("[DB] Session fetch result:", rows);

    return rows[0] || null;
  } catch (error) {
    console.error("[DB] Error fetching session:", error);
    throw error;
  }
}

// Delete session from DB
export async function deleteSessionFromDB(sessionName: string) {
  try {
    console.log(`[DB] Deleting session: ${sessionName}`);

    const sql = "DELETE FROM sessions WHERE session_name = ?";

    const [result] = await pool.execute(sql, [sessionName]);

    console.log("[DB] Session deleted successfully", result);
  } catch (error) {
    console.error("[DB] Error deleting session:", error);
    throw error;
  }
}

// Get all sessions from DB
export async function getAllSessionsFromDB() {
  try {
    console.log("[DB] Fetching all sessions");
    const sql = "SELECT * FROM sessions";
    const [rows]: any = await pool.execute(sql);
    console.log(`[DB] Found ${rows.length} sessions`);
    return rows;
  } catch (error) {
    console.error("[DB] Error fetching all sessions:", error);
    throw error;
  }
}

// Initialize Users Table
export async function initUsersTable() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(190) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.execute(sql);
    console.log("[DB] Users table initialized");

    // Seed default admin
    const [rows]: any = await pool.execute("SELECT COUNT(*) as count FROM users");
    if (rows[0].count === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await pool.execute(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        ["admin", hashedPassword, "admin"]
      );
      console.log("[DB] Default admin created (admin/admin123)");
    }
  } catch (error) {
    console.error("[DB] Error initializing users table:", error);
  }
}

// Initialize Contacts Table
export async function initContactsTable() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(190) UNIQUE,
        phone VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.execute(sql);
    console.log("[DB] Contacts table initialized");
  } catch (error) {
    console.error("[DB] Error initializing contacts table:", error);
  }
}

// Truncate Table
export async function truncateTable(tableName: string) {
  const allowedTables = ["contacts", "messages", "sessions"];
  if (!allowedTables.includes(tableName)) {
    throw new Error(`Truncation of table '${tableName}' is not allowed.`);
  }

  try {
    // Disable foreign key checks temporarily to allow truncation if there are constraints
    await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
    await pool.execute(`TRUNCATE TABLE ${tableName}`);
    await pool.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.log(`[DB] Table '${tableName}' truncated successfully`);
  } catch (error) {
    console.error(`[DB] Error truncating table '${tableName}':`, error);
    throw error;
  }
}

// Initialize Messages Table
export async function initMessagesTable() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        remote_jid VARCHAR(100) NOT NULL,
        from_me BOOLEAN NOT NULL,
        type VARCHAR(20) NOT NULL,
        content TEXT,
        media_url TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_remote (session_id, remote_jid),
        INDEX idx_timestamp (timestamp)
      )
    `;
    await pool.execute(sql);
    console.log("[DB] Messages table initialized");
  } catch (error) {
    console.error("[DB] Error initializing messages table:", error);
  }
}

// Save Message to DB
export async function saveMessageToDB(
  sessionId: string,
  remoteJid: string,
  fromMe: boolean,
  type: string,
  content: string | null = null,
  mediaUrl: string | null = null
) {
  try {
    const sql = `
      INSERT INTO messages (session_id, remote_jid, from_me, type, content, media_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.execute(sql, [sessionId, remoteJid, fromMe, type, content, mediaUrl]);
    // console.log(`[DB] Message saved: ${fromMe ? 'OUT' : 'IN'} ${remoteJid}`);
  } catch (error) {
    console.error("[DB] Error saving message:", error);
  }
}

// Get Messages from DB
export async function getMessagesFromDB(sessionId: string, remoteJid: string, limit: number = 50) {
  try {
    const sql = `
      SELECT * FROM messages 
      WHERE session_id = ? AND remote_jid = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    const [rows]: any = await pool.execute(sql, [sessionId, remoteJid, limit.toString()]);
    return rows.reverse(); // Return oldest first for chat view
  } catch (error) {
    console.error("[DB] Error fetching messages:", error);
    return [];
  }
}
// Get Chat Threads from DB
export async function getChatThreadsFromDB(sessionId: string) {
  try {
    const sql = `
      SELECT m.* 
      FROM messages m
      INNER JOIN (
          SELECT session_id, remote_jid, MAX(timestamp) as max_timestamp
          FROM messages
          WHERE session_id = ?
          GROUP BY session_id, remote_jid
      ) latest ON m.session_id = latest.session_id 
              AND m.remote_jid = latest.remote_jid 
              AND m.timestamp = latest.max_timestamp
      ORDER BY m.timestamp DESC
    `;
    const [rows]: any = await pool.execute(sql, [sessionId]);
    return rows;
  } catch (error) {
    console.error("[DB] Error fetching chat threads:", error);
    return [];
  }
}
