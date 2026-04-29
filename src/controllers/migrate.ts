import { Hono } from "hono";
import * as mysql from "mysql2/promise";
import * as bcrypt from "bcryptjs";

export const createMigrateController = () => {
  const app = new Hono();

  app.post("/run", async (c) => {
    try {
      console.log('[Migration] Starting database migration...');

      // Create connection
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mywhatsapp',
        port: parseInt(process.env.DB_PORT || '3306'),
      });

      console.log('[Migration] Connected to database:', process.env.DB_NAME || 'mywhatsapp');

      const results = {
        sessions: false,
        users: false,
        contacts: false,
        messages: false,
        admin: false
      };

      // Create sessions table
      console.log('[Migration] Creating sessions table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_name VARCHAR(100) NOT NULL UNIQUE,
          session_data LONGTEXT NOT NULL,
          created_by INT,
          updated_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      results.sessions = true;
      console.log('[Migration] ✅ Sessions table created');

      // Create users table
      console.log('[Migration] Creating users table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(190) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      results.users = true;
      console.log('[Migration] ✅ Users table created');

      // Create contacts table
      console.log('[Migration] Creating contacts table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS contacts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(190) UNIQUE,
          phone VARCHAR(50) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      results.contacts = true;
      console.log('[Migration] ✅ Contacts table created');

      // Create messages table
      console.log('[Migration] Creating messages table...');
      await connection.execute(`
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
      `);
      results.messages = true;
      console.log('[Migration] ✅ Messages table created');

      // Seed default admin user
      console.log('[Migration] Seeding default admin user...');
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
      if ((users as any)[0].count === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.execute(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          ['admin', hashedPassword, 'admin']
        );
        results.admin = true;
        console.log('[Migration] ✅ Default admin created (admin/admin123)');
      } else {
        console.log('[Migration] ℹ️  Admin user already exists');
        results.admin = true;
      }

      await connection.end();

      console.log('[Migration] 🎉 All migrations completed successfully!');

      return c.json({
        success: true,
        message: "Database migration completed successfully",
        tables: results,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('[Migration] ❌ Error:', error.message);
      return c.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  return app;
};