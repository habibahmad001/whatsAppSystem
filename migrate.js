import mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

async function runMigrations() {
  console.log('🔄 Starting database migrations...\n');

  // Create connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mywhatsapp',
    port: parseInt(process.env.DB_PORT || '3306'),
  });

  console.log('✅ Connected to database:', process.env.DB_NAME || 'mywhatsapp');

  try {
    // Create sessions table
    console.log('\n📋 Creating sessions table...');
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
    console.log('✅ Sessions table created');

    // Create users table
    console.log('\n📋 Creating users table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(190) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create contacts table
    console.log('\n📋 Creating contacts table...');
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
    console.log('✅ Contacts table created');

    // Create messages table
    console.log('\n📋 Creating messages table...');
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
    console.log('✅ Messages table created');

    // Seed default admin user
    console.log('\n👤 Seeding default admin user...');
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('✅ Default admin created (admin/admin123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📊 Database tables created:');
    console.log('   - sessions');
    console.log('   - users');
    console.log('   - contacts');
    console.log('   - messages');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});