/**
 * SQLite Database Configuration and Initialization
 * Using better-sqlite3 for synchronous, fast SQLite operations
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'dl_generator.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export let db = null;

/**
 * Initialize the SQLite database with all required tables
 */
export async function initDatabase() {
  db = new Database(DB_PATH);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      access_level TEXT NOT NULL DEFAULT 'User',
      branch TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create User-Client assignments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Signature Assets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS signature_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      uploaded_by INTEGER,
      status TEXT DEFAULT 'Pending',
      validity_period TEXT DEFAULT 'Indefinite',
      purpose TEXT DEFAULT 'DL Generation',
      admin_message TEXT,
      approved_by TEXT,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // Create Signature Approval Requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS signature_approval_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      signature_id INTEGER NOT NULL,
      requested_by INTEGER NOT NULL,
      status TEXT DEFAULT 'Pending',
      lark_message_id TEXT,
      lark_user_id TEXT,
      responded_at DATETIME,
      responded_by TEXT,
      response_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (signature_id) REFERENCES signature_assets(id) ON DELETE CASCADE,
      FOREIGN KEY (requested_by) REFERENCES users(id)
    )
  `);

  // Create Templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      file_path TEXT,
      template_type TEXT DEFAULT 'DL',
      client_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Create DL Generation Jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dl_generation_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_uuid TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      process_mode TEXT NOT NULL,
      output_format TEXT NOT NULL,
      client_name TEXT NOT NULL,
      template_id INTEGER,
      signature_id INTEGER,
      excel_file_path TEXT,
      output_file_path TEXT,
      status TEXT DEFAULT 'Pending',
      records_processed INTEGER DEFAULT 0,
      total_records INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (template_id) REFERENCES templates(id),
      FOREIGN KEY (signature_id) REFERENCES signature_assets(id)
    )
  `);

  // Create Audit Trail table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT DEFAULT 'success',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create Lark Bot Configuration table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lark_bot_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webhook_url TEXT NOT NULL,
      secret_key TEXT,
      is_active INTEGER DEFAULT 1,
      last_used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Handwriting Styles table (for GAN variation)
  db.exec(`
    CREATE TABLE IF NOT EXISTS handwriting_styles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      font_family TEXT NOT NULL,
      base_size INTEGER DEFAULT 24,
      rotation_variance REAL DEFAULT 2.0,
      spacing_variance REAL DEFAULT 1.5,
      stroke_width_variance REAL DEFAULT 0.5,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default admin user if not exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@spmadridlaw.com');
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO users (email, name, access_level, branch, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin@spmadridlaw.com', 'Rivera, Gabriel Ludwig R.', 'Administrator', 'Main', 'Active');
    
    // Assign all clients to admin
    const adminId = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@spmadridlaw.com').id;
    const defaultClients = ['BPI', 'EON BANK', 'USB PLC', 'BPI BANKO', 'CITIBANK', 'HSBC'];
    const insertClient = db.prepare('INSERT INTO user_clients (user_id, client_name) VALUES (?, ?)');
    for (const client of defaultClients) {
      insertClient.run(adminId, client);
    }
  }

  // Insert default handwriting styles
  const existingStyles = db.prepare('SELECT COUNT(*) as count FROM handwriting_styles').get();
  if (existingStyles.count === 0) {
    const insertStyle = db.prepare(`
      INSERT INTO handwriting_styles (name, font_family, base_size, rotation_variance, spacing_variance, stroke_width_variance)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertStyle.run('Natural Cursive', 'Caveat', 28, 2.0, 1.5, 0.5);
    insertStyle.run('Formal Script', 'Dancing Script', 26, 1.5, 1.0, 0.3);
    insertStyle.run('Casual Hand', 'Indie Flower', 24, 3.0, 2.0, 0.7);
  }

  console.log('📦 Database tables created/verified');
  return db;
}

/**
 * Log an action to the audit trail
 */
export function logAuditAction(userId, userName, action, resourceType, resourceId, details, status = 'success') {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(userId, userName, action, resourceType, resourceId, JSON.stringify(details), status);
}

export default db;
