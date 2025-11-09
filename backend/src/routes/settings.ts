import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configuration multer pour upload de logo
const upload = multer({
  dest: 'uploads/logos/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers image (JPEG, PNG, GIF, SVG, WEBP) sont autorisés'));
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads/logos/')) {
  fs.mkdirSync('uploads/logos/', { recursive: true });
}

// Get user settings
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM settings WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      // Créer des paramètres par défaut
      const defaultSettings = await pool.query(
        `INSERT INTO settings (user_id) VALUES ($1) RETURNING *`,
        [req.userId]
      );
      return res.json({ settings: defaultSettings.rows[0] });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Upload logo
router.post('/logo', authenticate, upload.single('logo'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Vérifier si des paramètres existent déjà
    const existing = await pool.query(
      'SELECT id, logo_path FROM settings WHERE user_id = $1',
      [req.userId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Supprimer l'ancien logo si existe
      if (existing.rows[0].logo_path && fs.existsSync(existing.rows[0].logo_path)) {
        fs.unlinkSync(existing.rows[0].logo_path);
      }

      // Mettre à jour
      result = await pool.query(
        `UPDATE settings SET logo_path = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *`,
        [req.file.path, req.userId]
      );
    } else {
      // Créer
      result = await pool.query(
        `INSERT INTO settings (user_id, logo_path) VALUES ($1, $2) RETURNING *`,
        [req.userId, req.file.path]
      );
    }

    res.json({ 
      settings: result.rows[0],
      logoUrl: `/api/settings/logo/${req.userId}`
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get logo
router.get('/logo/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT logo_path FROM settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].logo_path) {
      return res.status(404).json({ error: 'Logo non trouvé' });
    }

    const logoPath = result.rows[0].logo_path;
    
    if (!fs.existsSync(logoPath)) {
      return res.status(404).json({ error: 'Fichier logo non trouvé' });
    }

    res.sendFile(path.resolve(logoPath));
  } catch (error) {
    console.error('Get logo error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete logo
router.delete('/logo', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT logo_path FROM settings WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].logo_path) {
      return res.status(404).json({ error: 'Logo non trouvé' });
    }

    const logoPath = result.rows[0].logo_path;

    // Supprimer le fichier
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }

    // Mettre à jour la base de données
    await pool.query(
      'UPDATE settings SET logo_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [req.userId]
    );

    res.json({ message: 'Logo supprimé' });
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update settings
router.put('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { company_name, company_email, company_phone, company_address, company_number, support_email, alert_email } = req.body;

    const existing = await pool.query(
      'SELECT id FROM settings WHERE user_id = $1',
      [req.userId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Mettre à jour
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (company_name !== undefined) {
        updates.push(`company_name = $${paramCount++}`);
        values.push(company_name);
      }
      if (company_email !== undefined) {
        updates.push(`company_email = $${paramCount++}`);
        values.push(company_email);
      }
      if (company_phone !== undefined) {
        updates.push(`company_phone = $${paramCount++}`);
        values.push(company_phone);
      }
      if (company_address !== undefined) {
        updates.push(`company_address = $${paramCount++}`);
        values.push(company_address);
      }
      if (company_number !== undefined) {
        updates.push(`company_number = $${paramCount++}`);
        values.push(company_number);
      }
      if (support_email !== undefined) {
        updates.push(`support_email = $${paramCount++}`);
        values.push(support_email);
      }
      if (alert_email !== undefined) {
        updates.push(`alert_email = $${paramCount++}`);
        values.push(alert_email);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Aucune modification à apporter' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(req.userId);

      result = await pool.query(
        `UPDATE settings SET ${updates.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
        values
      );
    } else {
      // Créer
      result = await pool.query(
        `INSERT INTO settings (user_id, company_name, company_email, company_phone, company_address, company_number, support_email, alert_email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [req.userId, company_name || null, company_email || null, company_phone || null, company_address || null, company_number || null, support_email || null, alert_email || null]
      );
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

