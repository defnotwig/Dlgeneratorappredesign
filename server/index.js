/**
 * DL Generator Backend Server
 * Features:
 * - SQLite Database for all data persistence
 * - GAN-style Handwritten Date Generation
 * - Lark Bot Integration for Approval Workflow
 * - Signature Asset Management
 * - Audit Trail Logging
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, db } from './database/db.js';
import { signatureRoutes } from './routes/signatures.js';
import { userRoutes } from './routes/users.js';
import { auditRoutes } from './routes/audit.js';
import { larkBotRoutes } from './routes/lark-bot.js';
import { handwritingRoutes } from './routes/handwriting.js';
import { templateRoutes } from './routes/templates.js';
import { dlGeneratorRoutes } from './routes/dl-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/signatures', signatureRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/lark', larkBotRoutes);
app.use('/api/handwriting', handwritingRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/dl-generator', dlGeneratorRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message 
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 DL Generator Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: SQLite (server/database/dl_generator.db)`);
      console.log(`🤖 Lark Bot: Ready for webhook integration`);
      console.log(`✍️ Handwriting Generator: GAN-style synthesis active`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
