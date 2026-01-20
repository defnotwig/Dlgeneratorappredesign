/**
 * DL Generator Routes - Demand Letter generation job management
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db, logAuditAction } from '../database/db.js';
import handwritingGenerator from '../services/handwriting-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads', 'excel');
const outputDir = path.join(__dirname, '..', 'uploads', 'output');
[uploadsDir, outputDir].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `excel_${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/dl-generator/jobs - List all DL generation jobs
router.get('/jobs', (req, res) => {
  try {
    const { userId, status, clientName } = req.query;
    let query = 'SELECT * FROM dl_generation_jobs WHERE 1=1';
    const params = [];
    if (userId) { query += ' AND user_id = ?'; params.push(userId); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (clientName) { query += ' AND client_name = ?'; params.push(clientName); }
    query += ' ORDER BY created_at DESC LIMIT 100';
    res.json(db.prepare(query).all(...params));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dl-generator/jobs/:id - Get single job
router.get('/jobs/:id', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM dl_generation_jobs WHERE id = ? OR job_uuid = ?').get(req.params.id, req.params.id);
    job ? res.json(job) : res.status(404).json({ error: 'Job not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dl-generator/jobs - Create new DL generation job
router.post('/jobs', upload.single('excelFile'), async (req, res) => {
  try {
    const { userId, processMode, outputFormat, clientName, templateId, signatureId } = req.body;
    
    if (!processMode || !outputFormat || !clientName) {
      return res.status(400).json({ error: 'processMode, outputFormat, and clientName are required' });
    }

    const jobUuid = uuidv4();
    const result = db.prepare(`
      INSERT INTO dl_generation_jobs (job_uuid, user_id, process_mode, output_format, client_name, template_id, signature_id, excel_file_path, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `).run(jobUuid, userId || 1, processMode, outputFormat, clientName, templateId, signatureId, req.file ? `/uploads/excel/${req.file.filename}` : null);

    logAuditAction(userId, 'User', 'DL_JOB_CREATED', 'dl_generation_jobs', result.lastInsertRowid, { jobUuid, clientName, processMode });

    res.status(201).json({
      id: result.lastInsertRowid,
      jobUuid,
      status: 'Pending',
      message: 'DL generation job created'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dl-generator/jobs/:id/process - Start processing a job
router.post('/jobs/:id/process', async (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM dl_generation_jobs WHERE id = ? OR job_uuid = ?').get(req.params.id, req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    db.prepare('UPDATE dl_generation_jobs SET status = ? WHERE id = ?').run('Processing', job.id);

    // Get signature if specified
    let signatureData = null;
    if (job.signature_id) {
      const sig = db.prepare('SELECT * FROM signature_assets WHERE id = ? AND status = "Approved"').get(job.signature_id);
      if (sig) {
        const sigPath = path.join(__dirname, '..', sig.file_path);
        if (fs.existsSync(sigPath)) {
          const composite = await handwritingGenerator.compositeSignatureWithDate(sigPath, new Date());
          signatureData = composite.image;
        }
      }
    }

    // Simulate processing (in real implementation, would process Excel and generate docs)
    setTimeout(() => {
      const outputFile = `output_${job.job_uuid}.zip`;
      db.prepare(`
        UPDATE dl_generation_jobs 
        SET status = 'Completed', output_file_path = ?, completed_at = CURRENT_TIMESTAMP, records_processed = total_records
        WHERE id = ?
      `).run(`/uploads/output/${outputFile}`, job.id);
    }, 2000);

    res.json({ message: 'Processing started', jobId: job.id, status: 'Processing' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dl-generator/jobs/:id/download - Download job output
router.get('/jobs/:id/download', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM dl_generation_jobs WHERE id = ? OR job_uuid = ?').get(req.params.id, req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'Completed' || !job.output_file_path) {
      return res.status(400).json({ error: 'Job output not ready' });
    }
    const filePath = path.join(__dirname, '..', job.output_file_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Output file not found' });
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/dl-generator/jobs/:id - Cancel/delete job
router.delete('/jobs/:id', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM dl_generation_jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    // Clean up files
    [job.excel_file_path, job.output_file_path].forEach(fp => {
      if (fp) {
        const fullPath = path.join(__dirname, '..', fp);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    });
    
    db.prepare('DELETE FROM dl_generation_jobs WHERE id = ?').run(req.params.id);
    logAuditAction(null, 'Admin', 'DL_JOB_DELETED', 'dl_generation_jobs', req.params.id, { jobUuid: job.job_uuid });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dl-generator/clients - Get available clients for current user
router.get('/clients', (req, res) => {
  try {
    const { userId } = req.query;
    if (userId) {
      const clients = db.prepare('SELECT client_name FROM user_clients WHERE user_id = ?').all(userId);
      res.json(clients.map(c => c.client_name));
    } else {
      res.json(['BPI', 'EON BANK', 'USB PLC', 'BPI BANKO', 'CITIBANK', 'HSBC']);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dl-generator/stats - Get generation statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalJobs: db.prepare('SELECT COUNT(*) as count FROM dl_generation_jobs').get().count,
      completedJobs: db.prepare('SELECT COUNT(*) as count FROM dl_generation_jobs WHERE status = "Completed"').get().count,
      todayJobs: db.prepare('SELECT COUNT(*) as count FROM dl_generation_jobs WHERE DATE(created_at) = DATE("now")').get().count,
      byClient: db.prepare('SELECT client_name, COUNT(*) as count FROM dl_generation_jobs GROUP BY client_name').all()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as dlGeneratorRoutes };
