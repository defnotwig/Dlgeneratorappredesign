/**
 * Handwriting Routes
 * Handles GAN-style handwritten date generation
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db, logAuditAction } from '../database/db.js';
import handwritingGenerator from '../services/handwriting-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure output directory exists
const outputDir = path.join(__dirname, '..', 'uploads', 'generated');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// GET /api/handwriting/styles - Get available handwriting styles
router.get('/styles', (req, res) => {
  try {
    const styles = db.prepare('SELECT * FROM handwriting_styles WHERE is_active = 1').all();
    res.json(styles);
  } catch (error) {
    console.error('Error fetching styles:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/handwriting/generate-date - Generate handwritten date image
router.post('/generate-date', async (req, res) => {
  try {
    const { 
      date, 
      style = 'Natural Cursive', 
      format = 'full',
      width = 300,
      height = 80
    } = req.body;

    const dateObj = date ? new Date(date) : new Date();

    // Get style configuration
    const styleConfig = db.prepare('SELECT * FROM handwriting_styles WHERE name = ?').get(style);

    const result = await handwritingGenerator.generateHandwrittenDate({
      date: dateObj,
      format,
      width: parseInt(width),
      height: parseInt(height),
      style: styleConfig || undefined
    });

    // Save to file
    const filename = `date_${uuidv4()}.png`;
    const filePath = path.join(outputDir, filename);
    
    // Extract base64 data and save
    const base64Data = result.image.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    logAuditAction(null, 'System', 'DATE_GENERATED', 'handwriting', null, { date: dateObj.toISOString(), style });

    res.json({
      success: true,
      image: result.image,
      filePath: `/uploads/generated/${filename}`,
      metadata: {
        date: dateObj.toISOString(),
        style,
        format,
        dimensions: { width: parseInt(width), height: parseInt(height) }
      }
    });
  } catch (error) {
    console.error('Error generating date:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// POST /api/handwriting/generate-variations - Generate multiple date variations
router.post('/generate-variations', async (req, res) => {
  try {
    const { date, count = 5 } = req.body;
    const dateObj = date ? new Date(date) : new Date();

    const variations = await handwritingGenerator.generateDateVariations(dateObj, Math.min(count, 10));

    res.json({
      success: true,
      variations,
      date: dateObj.toISOString()
    });
  } catch (error) {
    console.error('Error generating variations:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// POST /api/handwriting/composite - Composite signature with handwritten date
router.post('/composite', async (req, res) => {
  try {
    const { 
      signatureId,
      signaturePath,
      date,
      style = 'Natural Cursive',
      position = 'below',
      outputWidth = 400,
      outputHeight = 150
    } = req.body;

    let sigPath;
    
    if (signatureId) {
      const signature = db.prepare('SELECT file_path FROM signature_assets WHERE id = ? AND status = "Approved"').get(signatureId);
      if (!signature) {
        return res.status(404).json({ error: 'Approved signature not found' });
      }
      sigPath = path.join(__dirname, '..', signature.file_path);
    } else if (signaturePath) {
      sigPath = signaturePath.startsWith('/') 
        ? path.join(__dirname, '..', signaturePath)
        : signaturePath;
    } else {
      return res.status(400).json({ error: 'signatureId or signaturePath is required' });
    }

    if (!fs.existsSync(sigPath)) {
      return res.status(404).json({ error: 'Signature file not found' });
    }

    const dateObj = date ? new Date(date) : new Date();

    const result = await handwritingGenerator.compositeSignatureWithDate(
      sigPath,
      dateObj,
      {
        style,
        position,
        outputWidth: parseInt(outputWidth),
        outputHeight: parseInt(outputHeight)
      }
    );

    // Save composite image
    const filename = `composite_${uuidv4()}.png`;
    const filePath = path.join(outputDir, filename);
    
    const base64Data = result.image.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    logAuditAction(null, 'System', 'SIGNATURE_COMPOSITE_CREATED', 'handwriting', null, { signatureId, date: dateObj.toISOString() });

    res.json({
      success: true,
      image: result.image,
      filePath: `/uploads/generated/${filename}`,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Error creating composite:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// POST /api/handwriting/styles - Create new handwriting style
router.post('/styles', (req, res) => {
  try {
    const {
      name,
      fontFamily,
      baseSize = 24,
      rotationVariance = 2.0,
      spacingVariance = 1.5,
      strokeWidthVariance = 0.5
    } = req.body;

    if (!name || !fontFamily) {
      return res.status(400).json({ error: 'Name and fontFamily are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO handwriting_styles (name, font_family, base_size, rotation_variance, spacing_variance, stroke_width_variance)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, fontFamily, baseSize, rotationVariance, spacingVariance, strokeWidthVariance);

    const newStyle = db.prepare('SELECT * FROM handwriting_styles WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newStyle);
  } catch (error) {
    console.error('Error creating style:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/handwriting/styles/:id - Delete handwriting style
router.delete('/styles/:id', (req, res) => {
  try {
    db.prepare('UPDATE handwriting_styles SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Style deactivated' });
  } catch (error) {
    console.error('Error deleting style:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/handwriting/preview - Preview handwritten date without saving
router.get('/preview', async (req, res) => {
  try {
    const { date, style = 'Natural Cursive', format = 'full' } = req.query;
    const dateObj = date ? new Date(date) : new Date();

    const result = await handwritingGenerator.generateHandwrittenDate({
      date: dateObj,
      format,
      width: 300,
      height: 80
    });

    res.json({
      success: true,
      image: result.image,
      date: dateObj.toISOString()
    });
  } catch (error) {
    console.error('Error previewing date:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

export { router as handwritingRoutes };
