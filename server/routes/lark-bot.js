/**
 * Lark Bot Routes
 * Handles Lark Bot webhook configuration and signature approval messaging
 */

import express from 'express';
import { db, logAuditAction } from '../database/db.js';
import larkBot from '../services/lark-bot.js';

const router = express.Router();

// GET /api/lark/config - Get Lark bot configuration
router.get('/config', (req, res) => {
  try {
    const config = db.prepare(`
      SELECT id, webhook_url, is_active, last_used_at, created_at, updated_at 
      FROM lark_bot_config 
      WHERE is_active = 1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).get();
    
    // Mask secret_key for security
    if (config) {
      config.hasSecretKey = !!db.prepare('SELECT secret_key FROM lark_bot_config WHERE id = ?').get(config.id)?.secret_key;
    }

    res.json(config || null);
  } catch (error) {
    console.error('Error fetching Lark config:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lark/config - Save Lark bot configuration
router.post('/config', (req, res) => {
  try {
    const { webhookUrl, secretKey } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'Webhook URL is required' });
    }

    // Deactivate existing configs
    db.prepare('UPDATE lark_bot_config SET is_active = 0').run();

    // Insert new config
    const stmt = db.prepare(`
      INSERT INTO lark_bot_config (webhook_url, secret_key, is_active)
      VALUES (?, ?, 1)
    `);
    
    const result = stmt.run(webhookUrl, secretKey || null);

    logAuditAction(null, 'Admin', 'LARK_CONFIG_UPDATED', 'lark_bot_config', result.lastInsertRowid, { webhookUrl: webhookUrl.substring(0, 50) + '...' });

    res.status(201).json({ 
      message: 'Lark bot configuration saved',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error saving Lark config:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lark/test - Test Lark bot connection
router.post('/test', async (req, res) => {
  try {
    const { webhookUrl, secretKey } = req.body;

    if (!webhookUrl) {
      // Try to get from database
      const config = db.prepare('SELECT webhook_url, secret_key FROM lark_bot_config WHERE is_active = 1 LIMIT 1').get();
      if (!config) {
        return res.status(400).json({ error: 'No webhook URL configured' });
      }
      req.body.webhookUrl = config.webhook_url;
      req.body.secretKey = config.secret_key;
    }

    const result = await larkBot.testLarkConnection(req.body.webhookUrl, req.body.secretKey);
    
    if (result.success) {
      // Update last_used_at
      db.prepare('UPDATE lark_bot_config SET last_used_at = CURRENT_TIMESTAMP WHERE is_active = 1').run();
    }

    res.json(result);
  } catch (error) {
    console.error('Error testing Lark connection:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// POST /api/lark/send-approval - Send signature approval request to Lark
router.post('/send-approval', async (req, res) => {
  try {
    const { signatureId, requestedBy, validityPeriod, purpose, adminMessage } = req.body;

    if (!signatureId) {
      return res.status(400).json({ error: 'Signature ID is required' });
    }

    // Get signature details
    const signature = db.prepare('SELECT * FROM signature_assets WHERE id = ?').get(signatureId);
    if (!signature) {
      return res.status(404).json({ error: 'Signature not found' });
    }

    // Get Lark config
    const config = db.prepare('SELECT * FROM lark_bot_config WHERE is_active = 1 LIMIT 1').get();
    if (!config) {
      return res.status(400).json({ error: 'Lark bot not configured' });
    }

    // Create approval request record
    const approvalStmt = db.prepare(`
      INSERT INTO signature_approval_requests (signature_id, requested_by, status)
      VALUES (?, ?, 'Pending')
    `);
    const approvalResult = approvalStmt.run(signatureId, requestedBy || 1);

    // Build approval card data
    const approvalRequest = {
      id: approvalResult.lastInsertRowid,
      signaturePreview: `http://localhost:3001${signature.file_path}`,
      requestedDate: new Date().toISOString(),
      requestedBy: requestedBy || 'Admin',
      validityPeriod: validityPeriod || signature.validity_period || 'Indefinite',
      purpose: purpose || signature.purpose || 'DL Generation',
      adminMessage: adminMessage || signature.admin_message || ''
    };

    // Send to Lark
    const result = await larkBot.sendSignatureApprovalCard(approvalRequest, config.webhook_url, config.secret_key);

    if (result.success) {
      // Update last_used_at
      db.prepare('UPDATE lark_bot_config SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(config.id);
      
      logAuditAction(null, 'Admin', 'LARK_APPROVAL_SENT', 'signature_approval_requests', approvalResult.lastInsertRowid, { signatureId });
    }

    res.json({
      success: result.success,
      requestId: approvalResult.lastInsertRowid,
      message: result.success ? 'Approval request sent to Lark' : 'Failed to send approval request'
    });
  } catch (error) {
    console.error('Error sending Lark approval:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// POST /api/lark/send-notification - Send general notification to Lark
router.post('/send-notification', async (req, res) => {
  try {
    const { message, title, content } = req.body;

    // Get Lark config
    const config = db.prepare('SELECT * FROM lark_bot_config WHERE is_active = 1 LIMIT 1').get();
    if (!config) {
      return res.status(400).json({ error: 'Lark bot not configured' });
    }

    let result;
    if (title && content) {
      // Rich text message
      result = await larkBot.sendRichTextMessage(title, content, config.webhook_url, config.secret_key);
    } else {
      // Simple text message
      result = await larkBot.sendTextMessage(message || 'Test notification from DL Generator', config.webhook_url, config.secret_key);
    }

    if (result.success) {
      db.prepare('UPDATE lark_bot_config SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(config.id);
    }

    res.json(result);
  } catch (error) {
    console.error('Error sending Lark notification:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// GET /api/lark/approval-requests - Get all approval requests
router.get('/approval-requests', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT sar.*, sa.file_path, sa.file_name 
      FROM signature_approval_requests sar
      JOIN signature_assets sa ON sar.signature_id = sa.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND sar.status = ?';
      params.push(status);
    }

    query += ' ORDER BY sar.created_at DESC';
    const requests = db.prepare(query).all(...params);

    res.json(requests);
  } catch (error) {
    console.error('Error fetching approval requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/lark/approval-requests/:id/respond - Respond to approval request
router.patch('/approval-requests/:id/respond', async (req, res) => {
  try {
    const { status, respondedBy, reason } = req.body;
    const requestId = req.params.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected' });
    }

    // Update approval request
    db.prepare(`
      UPDATE signature_approval_requests 
      SET status = ?, responded_by = ?, response_reason = ?, responded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, respondedBy || 'Attorney', reason || null, requestId);

    // Get the request to update signature status
    const request = db.prepare('SELECT signature_id FROM signature_approval_requests WHERE id = ?').get(requestId);
    
    if (request) {
      // Update signature status
      if (status === 'Approved') {
        db.prepare(`
          UPDATE signature_assets 
          SET status = 'Approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(respondedBy || 'Attorney', request.signature_id);
      } else {
        db.prepare(`
          UPDATE signature_assets SET status = 'Rejected' WHERE id = ?
        `).run(request.signature_id);
      }
    }

    logAuditAction(null, respondedBy, `SIGNATURE_${status.toUpperCase()}`, 'signature_approval_requests', requestId, { reason });

    res.json({ message: `Request ${status.toLowerCase()}`, requestId });
  } catch (error) {
    console.error('Error responding to approval request:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as larkBotRoutes };
