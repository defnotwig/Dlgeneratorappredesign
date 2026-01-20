/**
 * Signature Routes
 * Handles signature asset management: upload, list, approve/reject, delete
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db, logAuditAction } from '../database/db.js';
import { getManilaTimestampForSQL } from '../utils/timezone.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for signature uploads
const uploadsDir = path.join(__dirname, '..', 'uploads', 'signatures');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `sig_${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, and WebP images are allowed'));
    }
  }
});

// GET /api/signatures - List all signatures
router.get('/', (req, res) => {
  try {
    const { status, userId } = req.query;
    let query = 'SELECT * FROM signature_assets WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (userId) {
      query += ' AND uploaded_by = ?';
      params.push(userId);
    }

    query += ' ORDER BY created_at DESC';
    const signatures = db.prepare(query).all(...params);
    res.json(signatures);
  } catch (error) {
    console.error('Error fetching signatures:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/signatures/:id - Get single signature
router.get('/:id', (req, res) => {
  try {
    const signature = db.prepare('SELECT * FROM signature_assets WHERE id = ?').get(req.params.id);
    if (!signature) {
      return res.status(404).json({ error: 'Signature not found' });
    }
    res.json(signature);
  } catch (error) {
    console.error('Error fetching signature:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/signatures - Upload new signature
router.post('/', upload.single('signature'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { uploadedBy, validityPeriod, purpose, adminMessage } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO signature_assets (file_path, file_name, uploaded_by, validity_period, purpose, admin_message, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending')
    `);
    
    const result = stmt.run(
      `/uploads/signatures/${req.file.filename}`,
      req.file.originalname,
      uploadedBy || null,
      validityPeriod || 'Indefinite',
      purpose || 'DL Generation',
      adminMessage || null
    );

    // Log audit action
    logAuditAction(
      uploadedBy || null,
      'Admin',
      'SIGNATURE_UPLOADED',
      'signature_assets',
      result.lastInsertRowid,
      { fileName: req.file.originalname }
    );

    const newSignature = db.prepare('SELECT * FROM signature_assets WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newSignature);
  } catch (error) {
    console.error('Error uploading signature:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/signatures/:id/approve - Approve signature
router.patch('/:id/approve', (req, res) => {
  try {
    const { approvedBy, reason } = req.body;
    
    // FIXED: Use Manila timezone timestamp instead of CURRENT_TIMESTAMP (which is UTC)
    const manilaTimestamp = getManilaTimestampForSQL();
    
    db.prepare(`
      UPDATE signature_assets 
      SET status = 'Approved', approved_by = ?, approved_at = ?, updated_at = ?
      WHERE id = ?
    `).run(approvedBy || 'Attorney', manilaTimestamp, manilaTimestamp, req.params.id);

    logAuditAction(null, approvedBy, 'SIGNATURE_APPROVED', 'signature_assets', req.params.id, { reason });

    const signature = db.prepare('SELECT * FROM signature_assets WHERE id = ?').get(req.params.id);
    res.json(signature);
  } catch (error) {
    console.error('Error approving signature:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/signatures/:id/reject - Reject signature
router.patch('/:id/reject', (req, res) => {
  try {
    const { rejectedBy, reason } = req.body;
    
    // FIXED: Use Manila timezone timestamp instead of CURRENT_TIMESTAMP (which is UTC)
    const manilaTimestamp = getManilaTimestampForSQL();
    
    db.prepare(`
      UPDATE signature_assets 
      SET status = 'Rejected', updated_at = ?
      WHERE id = ?
    `).run(manilaTimestamp, req.params.id);

    logAuditAction(null, rejectedBy, 'SIGNATURE_REJECTED', 'signature_assets', req.params.id, { reason });

    const signature = db.prepare('SELECT * FROM signature_assets WHERE id = ?').get(req.params.id);
    res.json(signature);
  } catch (error) {
    console.error('Error rejecting signature:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/signatures/:id - Delete signature
router.delete('/:id', (req, res) => {
  try {
    const signature = db.prepare('SELECT * FROM signature_assets WHERE id = ?').get(req.params.id);
    if (!signature) {
      return res.status(404).json({ error: 'Signature not found' });
    }

    // Delete file
    const filePath = path.join(__dirname, '..', signature.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM signature_assets WHERE id = ?').run(req.params.id);
    
    logAuditAction(null, 'Admin', 'SIGNATURE_DELETED', 'signature_assets', req.params.id, { fileName: signature.file_name });

    res.json({ message: 'Signature deleted successfully' });
  } catch (error) {
    console.error('Error deleting signature:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/signatures/active - Get active approved signature
router.get('/status/active', (req, res) => {
  try {
    const signature = db.prepare(`
      SELECT * FROM signature_assets 
      WHERE status = 'Approved' 
      ORDER BY approved_at DESC 
      LIMIT 1
    `).get();
    
    res.json(signature || null);
  } catch (error) {
    console.error('Error fetching active signature:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as signatureRoutes };
