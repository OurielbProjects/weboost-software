import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configuration multer pour upload de fichiers
const upload = multer({
  dest: 'uploads/contracts/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers PDF, DOC et DOCX sont autorisés'));
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads/contracts/')) {
  fs.mkdirSync('uploads/contracts/', { recursive: true });
}

// Get all customers
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    let query = 'SELECT * FROM customers';
    const params: any[] = [];

    // Les clients ne voient que leurs propres données
    if (req.userRole === 'client') {
      query += ' WHERE user_id = $1';
      params.push(req.userId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ customers: result.rows });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get customer by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    let query = 'SELECT * FROM customers WHERE id = $1';
    const params: any[] = [id];

    // Les clients ne voient que leurs propres données
    if (req.userRole === 'client') {
      query += ' AND user_id = $2';
      params.push(req.userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create customer
router.post('/', authenticate, requireAdmin, upload.single('contract'), async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      company_number,
      website_url,
      custom_fields = '{}',
      collaboration_start_date,
      services = '[]',
      api_keys = '[]'
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }

    let contract_file_path = null;
    if (req.file) {
      contract_file_path = req.file.path;
    }

        const result = await pool.query(
          `INSERT INTO customers (
            name, email, phone, address, company_number, website_url, contract_file_path,
            custom_fields, collaboration_start_date, services, api_keys, user_id, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *`,
          [
            name, email, phone, address, company_number || null, website_url, contract_file_path,
            typeof custom_fields === 'string' ? custom_fields : JSON.stringify(custom_fields),
            collaboration_start_date || null,
            typeof services === 'string' ? services : JSON.stringify(services),
            typeof api_keys === 'string' ? api_keys : JSON.stringify(api_keys),
            null, // user_id sera défini plus tard si nécessaire
            (req as AuthRequest).userId
          ]
        );

    res.status(201).json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update customer
router.put('/:id', authenticate, requireAdmin, upload.single('contract'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      company_number,
      website_url,
      custom_fields,
      collaboration_start_date,
      services,
      api_keys
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (company_number !== undefined) {
      updates.push(`company_number = $${paramCount++}`);
      values.push(company_number);
    }
    if (website_url !== undefined) {
      updates.push(`website_url = $${paramCount++}`);
      values.push(website_url);
    }
    if (req.file) {
      // Supprimer l'ancien fichier si existe
      const oldCustomer = await pool.query('SELECT contract_file_path FROM customers WHERE id = $1', [id]);
      if (oldCustomer.rows[0]?.contract_file_path && fs.existsSync(oldCustomer.rows[0].contract_file_path)) {
        fs.unlinkSync(oldCustomer.rows[0].contract_file_path);
      }
      updates.push(`contract_file_path = $${paramCount++}`);
      values.push(req.file.path);
    }
    if (custom_fields !== undefined) {
      updates.push(`custom_fields = $${paramCount++}`);
      values.push(typeof custom_fields === 'string' ? custom_fields : JSON.stringify(custom_fields));
    }
    if (collaboration_start_date !== undefined) {
      updates.push(`collaboration_start_date = $${paramCount++}`);
      values.push(collaboration_start_date || null);
    }
    if (services !== undefined) {
      updates.push(`services = $${paramCount++}`);
      values.push(typeof services === 'string' ? services : JSON.stringify(services));
    }
    if (api_keys !== undefined) {
      updates.push(`api_keys = $${paramCount++}`);
      values.push(typeof api_keys === 'string' ? api_keys : JSON.stringify(api_keys));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification à apporter' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete customer (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Supprimer le fichier de contrat si existe
    const customer = await pool.query('SELECT contract_file_path FROM customers WHERE id = $1', [id]);
    if (customer.rows[0]?.contract_file_path && fs.existsSync(customer.rows[0].contract_file_path)) {
      fs.unlinkSync(customer.rows[0].contract_file_path);
    }

    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json({ message: 'Client supprimé' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

