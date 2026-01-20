/**
 * Audit Routes
 * Handles audit trail retrieval and filtering
 */

import express from 'express';
import { db } from '../database/db.js';

const router = express.Router();

// GET /api/audit - Get audit logs with optional filtering
router.get('/', (req, res) => {
  try {
    const { 
      userId, 
      action, 
      resourceType, 
      status, 
      startDate, 
      endDate, 
      limit = 100, 
      offset = 0 
    } = req.query;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    if (action) {
      query += ' AND action LIKE ?';
      params.push(`%${action}%`);
    }
    if (resourceType) {
      query += ' AND resource_type = ?';
      params.push(resourceType);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const totalCount = db.prepare(countQuery).get(...params).count;

    // Add ordering and pagination
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = db.prepare(query).all(...params);

    res.json({
      logs,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + logs.length < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/audit/actions - Get distinct action types
router.get('/actions', (req, res) => {
  try {
    const actions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action').all();
    res.json(actions.map(a => a.action));
  } catch (error) {
    console.error('Error fetching action types:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/audit/resources - Get distinct resource types
router.get('/resources', (req, res) => {
  try {
    const resources = db.prepare('SELECT DISTINCT resource_type FROM audit_logs WHERE resource_type IS NOT NULL ORDER BY resource_type').all();
    res.json(resources.map(r => r.resource_type));
  } catch (error) {
    console.error('Error fetching resource types:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/audit/stats - Get audit statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalLogs: db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count,
      todayLogs: db.prepare(`
        SELECT COUNT(*) as count FROM audit_logs 
        WHERE DATE(created_at) = DATE('now')
      `).get().count,
      successCount: db.prepare(`
        SELECT COUNT(*) as count FROM audit_logs WHERE status = 'success'
      `).get().count,
      failureCount: db.prepare(`
        SELECT COUNT(*) as count FROM audit_logs WHERE status = 'failure'
      `).get().count,
      recentActions: db.prepare(`
        SELECT action, COUNT(*) as count 
        FROM audit_logs 
        GROUP BY action 
        ORDER BY count DESC 
        LIMIT 5
      `).all()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/audit/:id - Get single audit log entry
router.get('/:id', (req, res) => {
  try {
    const log = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }
    
    // Parse details JSON if present
    if (log.details) {
      try {
        log.details = JSON.parse(log.details);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as auditRoutes };
