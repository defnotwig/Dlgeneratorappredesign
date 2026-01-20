/**
 * Template Routes - Document template management
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

const uploadsDir = path.join(__dirname, '..', 'uploads', 'templates');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `template_${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', (req, res) => {
  try {
    const { templateType, clientId, isActive } = req.query;
    let query = 'SELECT * FROM templates WHERE 1=1';
    const params = [];
    if (templateType) { query += ' AND template_type = ?'; params.push(templateType); }
    if (clientId) { query += ' AND client_id = ?'; params.push(clientId); }
    if (isActive !== undefined) { query += ' AND is_active = ?'; params.push(isActive === 'true' ? 1 : 0); }
    query += ' ORDER BY created_at DESC';
    res.json(db.prepare(query).all(...params));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    template ? res.json(template) : res.status(404).json({ error: 'Template not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.single('template'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { name, description, templateType, clientId, createdBy } = req.body;
    if (!name) return res.status(400).json({ error: 'Template name is required' });

    const result = db.prepare(`
      INSERT INTO templates (name, description, file_path, template_type, client_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, description, `/uploads/templates/${req.file.filename}`, templateType || 'DL', clientId, createdBy);

    logAuditAction(createdBy, 'Admin', 'TEMPLATE_CREATED', 'templates', result.lastInsertRowid, { name });
    res.status(201).json(db.prepare('SELECT * FROM templates WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, description, templateType, clientId, isActive } = req.body;
    const manilaTimestamp = getManilaTimestampForSQL();
    db.prepare(`UPDATE templates SET name = COALESCE(?, name), description = COALESCE(?, description),
      template_type = COALESCE(?, template_type), client_id = COALESCE(?, client_id),
      is_active = COALESCE(?, is_active), updated_at = ? WHERE id = ?`
    ).run(name, description, templateType, clientId, isActive !== undefined ? (isActive ? 1 : 0) : null, manilaTimestamp, req.params.id);
    res.json(db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    if (template.file_path) {
      const filePath = path.join(__dirname, '..', template.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
    logAuditAction(null, 'Admin', 'TEMPLATE_DELETED', 'templates', req.params.id, { name: template.name });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/toggle', (req, res) => {
  try {
    const template = db.prepare('SELECT is_active FROM templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    const newStatus = template.is_active ? 0 : 1;
    const manilaTimestamp = getManilaTimestampForSQL();
    db.prepare('UPDATE templates SET is_active = ?, updated_at = ? WHERE id = ?').run(newStatus, manilaTimestamp, req.params.id);
    res.json({ isActive: !!newStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as templateRoutes };
