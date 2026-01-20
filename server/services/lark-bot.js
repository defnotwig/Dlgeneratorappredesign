/**
 * Lark Bot Integration Service
 * 
 * Handles communication with Lark Custom Bot for signature approval workflow.
 * Implements webhook-based messaging with interactive card support.
 * 
 * Reference: https://open.larksuite.com/document/client-docs/bot-v3/add-custom-bot
 */

import axios from 'axios';
import crypto from 'crypto';
import { db, logAuditAction } from '../database/db.js';
import { formatPhilippinesDate, getManilaTimestampForSQL } from '../utils/timezone.js';

// Lark Bot Configuration
const LARK_BOT_CONFIG = {
  // Default webhook URL - should be configured via admin panel
  webhookUrl: process.env.LARK_WEBHOOK_URL || '',
  secretKey: process.env.LARK_SECRET_KEY || '',
  requestTimeout: 10000,
  retryAttempts: 3
};

/**
 * Generate HMAC-SHA256 signature for Lark Bot authentication
 */
function generateSignature(timestamp, secret) {
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac('sha256', Buffer.from(stringToSign, 'utf-8'));
  hmac.update(Buffer.alloc(0)); // Empty data
  return hmac.digest('base64');
}

/**
 * Send message to Lark Bot webhook
 */
async function sendToLark(webhookUrl, payload, secretKey = null) {
  try {
    const requestBody = { ...payload };
    
    // Add signature if secret key is provided
    if (secretKey) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const sign = generateSignature(timestamp, secretKey);
      requestBody.timestamp = timestamp;
      requestBody.sign = sign;
    }

    const response = await axios.post(webhookUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: LARK_BOT_CONFIG.requestTimeout
    });

    return {
      success: response.data.code === 0,
      data: response.data,
      statusCode: response.data.code,
      message: response.data.msg
    };
  } catch (error) {
    console.error('Lark Bot Error:', error.message);
    return {
      success: false,
      error: error.message,
      statusCode: error.response?.data?.code || -1
    };
  }
}

/**
 * Send a simple text message
 */
export async function sendTextMessage(message, webhookUrl = null, secretKey = null) {
  const url = webhookUrl || getLarkConfig()?.webhook_url;
  const secret = secretKey || getLarkConfig()?.secret_key;
  
  if (!url) {
    throw new Error('Lark webhook URL not configured');
  }

  return sendToLark(url, {
    msg_type: 'text',
    content: {
      text: message
    }
  }, secret);
}

/**
 * Send rich text message
 */
export async function sendRichTextMessage(title, content, webhookUrl = null, secretKey = null) {
  const url = webhookUrl || getLarkConfig()?.webhook_url;
  const secret = secretKey || getLarkConfig()?.secret_key;

  if (!url) {
    throw new Error('Lark webhook URL not configured');
  }

  return sendToLark(url, {
    msg_type: 'post',
    content: {
      post: {
        en_us: {
          title,
          content
        }
      }
    }
  }, secret);
}

/**
 * Send interactive message card for signature approval
 * This creates a visually appealing card similar to the provided screenshots
 */
export async function sendSignatureApprovalCard(approvalRequest, webhookUrl = null, secretKey = null) {
  const url = webhookUrl || getLarkConfig()?.webhook_url;
  const secret = secretKey || getLarkConfig()?.secret_key;

  if (!url) {
    throw new Error('Lark webhook URL not configured');
  }

  const {
    requestId,
    signaturePreviewUrl,
    requestedBy,
    requestedDate,
    validityPeriod,
    purpose,
    adminMessage
  } = approvalRequest;

  // Interactive message card design
  const card = {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        title: {
          tag: 'plain_text',
          content: '📝 Signature Approval Request'
        },
        template: 'blue'
      },
      elements: [
        // Date Today - FIXED: Use Philippines timezone
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `📅 **Date Today:** ${formatPhilippinesDate(new Date())}`
          }
        },
        // Validity Period
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `⏳ **Validity Period:** ${validityPeriod || 'Indefinite'}`
          }
        },
        // Purpose
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `🎯 **Purpose:**\n• ${purpose || 'DL Generation'}`
          }
        },
        // Divider
        {
          tag: 'hr'
        },
        // Requested By
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `👤 **Requested By:** ${requestedBy}`
          }
        },
        // Request Date
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `📆 **Request Date:** ${requestedDate}`
          }
        },
        // Admin Message (if any)
        ...(adminMessage ? [{
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `💬 **Message from Admin:**\n${adminMessage}`
          }
        }] : []),
        // Signature Preview Note
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: '🖊️ Signature preview attached. Please review before approving.'
            }
          ]
        },
        // Divider before actions
        {
          tag: 'hr'
        },
        // Action Buttons
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: '✅ ALLOW'
              },
              type: 'primary',
              value: JSON.stringify({
                action: 'approve',
                requestId: requestId
              })
            },
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: '❌ REJECT'
              },
              type: 'danger',
              value: JSON.stringify({
                action: 'reject',
                requestId: requestId
              })
            }
          ]
        }
      ]
    }
  };

  const result = await sendToLark(url, card, secret);
  
  // Log the action
  if (result.success) {
    logAuditAction(
      null,
      requestedBy,
      'Lark Approval Sent',
      'signature_approval_requests',
      requestId,
      { webhookUsed: url.substring(0, 50) + '...', purpose },
      'success'
    );
  }

  return result;
}

/**
 * Send notification about approval/rejection result
 */
export async function sendApprovalResultNotification(result, webhookUrl = null, secretKey = null) {
  const url = webhookUrl || getLarkConfig()?.webhook_url;
  const secret = secretKey || getLarkConfig()?.secret_key;

  if (!url) {
    throw new Error('Lark webhook URL not configured');
  }

  const {
    requestId,
    status,
    respondedBy,
    requestedBy,
    reason
  } = result;

  const isApproved = status === 'Approved';
  const template = isApproved ? 'green' : 'red';
  const emoji = isApproved ? '✅' : '❌';
  const statusText = isApproved ? 'APPROVED' : 'REJECTED';

  const card = {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        title: {
          tag: 'plain_text',
          content: `${emoji} Signature ${statusText}`
        },
        template
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Request ID:** #${requestId}`
          }
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Status:** ${statusText}`
          }
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Responded By:** ${respondedBy}`
          }
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Original Requester:** ${requestedBy}`
          }
        },
        ...(reason ? [{
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Reason:** ${reason}`
          }
        }] : []),
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: isApproved 
                ? 'The signature asset is now active and can be used for DL generation.'
                : 'Please upload a new signature and submit for approval again.'
            }
          ]
        }
      ]
    }
  };

  return sendToLark(url, card, secret);
}

/**
 * Send task notification (similar to Image 2 - Task Assistant style)
 */
export async function sendTaskNotification(tasks, webhookUrl = null, secretKey = null) {
  const url = webhookUrl || getLarkConfig()?.webhook_url;
  const secret = secretKey || getLarkConfig()?.secret_key;

  if (!url) {
    throw new Error('Lark webhook URL not configured');
  }

  const taskList = tasks.map(task => 
    `• ${task.title} - ${task.time}`
  ).join('\n');

  const card = {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        title: {
          tag: 'plain_text',
          content: '📋 Recent ongoing tasks'
        },
        template: 'blue'
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: taskList
          }
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: 'More'
              },
              type: 'default'
            }
          ]
        }
      ]
    }
  };

  return sendToLark(url, card, secret);
}

/**
 * Get Lark Bot configuration from database
 */
function getLarkConfig() {
  if (!db) return null;
  
  try {
    const config = db.prepare(`
      SELECT webhook_url, secret_key, is_active 
      FROM lark_bot_config 
      WHERE is_active = 1 
      ORDER BY id DESC 
      LIMIT 1
    `).get();
    
    return config;
  } catch (error) {
    console.error('Error fetching Lark config:', error);
    return null;
  }
}

/**
 * Save Lark Bot configuration to database
 */
export function saveLarkConfig(webhookUrl, secretKey = null) {
  if (!db) throw new Error('Database not initialized');

  // Deactivate existing configs
  db.prepare('UPDATE lark_bot_config SET is_active = 0').run();

  // Insert new config
  const stmt = db.prepare(`
    INSERT INTO lark_bot_config (webhook_url, secret_key, is_active)
    VALUES (?, ?, 1)
  `);
  
  return stmt.run(webhookUrl, secretKey);
}

/**
 * Test Lark Bot connection
 */
export async function testLarkConnection(webhookUrl, secretKey = null) {
  try {
    const result = await sendToLark(webhookUrl, {
      msg_type: 'text',
      content: {
        text: '🔔 DL Generator Bot Connection Test\n\nThis is a test message from the DL Generator system. If you see this message, the Lark Bot integration is working correctly!'
      }
    }, secretKey);

    return {
      success: result.success,
      message: result.success 
        ? 'Connection successful! Test message sent to Lark.' 
        : `Connection failed: ${result.message || result.error}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection error: ${error.message}`
    };
  }
}

/**
 * Process webhook callback from Lark (for button clicks)
 * Note: Custom bots have limited callback support; this is for future Application Bot upgrade
 */
export function processLarkCallback(payload) {
  try {
    const { action, requestId } = JSON.parse(payload.action?.value || '{}');
    
    if (!action || !requestId) {
      return { success: false, error: 'Invalid callback payload' };
    }

    // Update approval request status in database
    const status = action === 'approve' ? 'Approved' : 'Rejected';
    
    // FIXED: Use Manila timezone timestamp instead of CURRENT_TIMESTAMP (which is UTC)
    const manilaTimestamp = getManilaTimestampForSQL();
    
    db.prepare(`
      UPDATE signature_approval_requests 
      SET status = ?, responded_at = ?
      WHERE id = ?
    `).run(status, manilaTimestamp, requestId);

    // Also update the signature asset status
    const request = db.prepare(`
      SELECT signature_id FROM signature_approval_requests WHERE id = ?
    `).get(requestId);

    if (request) {
      db.prepare(`
        UPDATE signature_assets 
        SET status = ?, approved_at = ?
        WHERE id = ?
      `).run(status, manilaTimestamp, request.signature_id);
    }

    return { success: true, status, requestId };
  } catch (error) {
    console.error('Error processing Lark callback:', error);
    return { success: false, error: error.message };
  }
}

export default {
  sendTextMessage,
  sendRichTextMessage,
  sendSignatureApprovalCard,
  sendApprovalResultNotification,
  sendTaskNotification,
  saveLarkConfig,
  testLarkConnection,
  processLarkCallback
};
