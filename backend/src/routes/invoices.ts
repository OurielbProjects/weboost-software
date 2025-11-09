import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configuration multer pour upload de factures
const upload = multer({
  dest: 'uploads/invoices/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers PDF, DOC, DOCX, JPG, JPEG et PNG sont autorisés'));
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads/invoices/')) {
  fs.mkdirSync('uploads/invoices/', { recursive: true });
}

// Get all invoices for a customer
router.get('/customer/:customerId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const { status, minAmount, maxAmount, startDate, endDate } = req.query;

    // Vérifier que l'utilisateur a accès à ce client
    const customerCheck = await pool.query(
      'SELECT id, created_by FROM customers WHERE id = $1',
      [customerId]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    const customer = customerCheck.rows[0];

    // Les clients ne voient que leurs propres factures
    if (req.userRole === 'client') {
      const clientCheck = await pool.query(
        'SELECT id FROM customers WHERE id = $1 AND user_id = $2',
        [customerId, req.userId]
      );
      if (clientCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }

    // Construire la requête avec les filtres
    let query = 'SELECT * FROM invoices WHERE customer_id = $1';
    const params: any[] = [customerId];
    let paramCount = 2;

    if (status) {
      query += ` AND status = $${paramCount++}`;
      params.push(status);
    }

    if (minAmount) {
      query += ` AND amount >= $${paramCount++}`;
      params.push(parseFloat(minAmount as string));
    }

    if (maxAmount) {
      query += ` AND amount <= $${paramCount++}`;
      params.push(parseFloat(maxAmount as string));
    }

    if (startDate) {
      query += ` AND invoice_date >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND invoice_date <= $${paramCount++}`;
      params.push(endDate);
    }

    query += ' ORDER BY invoice_date DESC';

    const result = await pool.query(query, params);
    res.json({ invoices: result.rows });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get invoice by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT i.*, c.created_by 
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    const invoice = result.rows[0];

    // Vérifier les permissions
    if (req.userRole === 'client') {
      const clientCheck = await pool.query(
        'SELECT id FROM customers WHERE id = $1 AND user_id = $2',
        [invoice.customer_id, req.userId]
      );
      if (clientCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Upload and create invoice
router.post('/', authenticate, requireAdmin, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const {
      customer_id,
      invoice_number,
      amount,
      currency = 'EUR',
      invoice_date,
      due_date,
      status = 'unpaid',
      notes
    } = req.body;

    if (!customer_id || !invoice_number || !amount || !invoice_date) {
      // Supprimer le fichier uploadé si les données sont invalides
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'customer_id, invoice_number, amount et invoice_date sont requis' });
    }

    // Vérifier que le client existe
    const customerCheck = await pool.query('SELECT id FROM customers WHERE id = $1', [customer_id]);
    if (customerCheck.rows.length === 0) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    const result = await pool.query(
      `INSERT INTO invoices (
        customer_id, invoice_number, file_path, amount, currency, 
        invoice_date, due_date, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        customer_id,
        invoice_number,
        req.file.path,
        parseFloat(amount),
        currency,
        invoice_date,
        due_date || null,
        status,
        notes || null
      ]
    );

    res.status(201).json({ invoice: result.rows[0] });
  } catch (error: any) {
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update invoice
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      invoice_number,
      amount,
      currency,
      invoice_date,
      due_date,
      status,
      notes
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (invoice_number !== undefined) {
      updates.push(`invoice_number = $${paramCount++}`);
      values.push(invoice_number);
    }
    if (amount !== undefined) {
      updates.push(`amount = $${paramCount++}`);
      values.push(parseFloat(amount));
    }
    if (currency !== undefined) {
      updates.push(`currency = $${paramCount++}`);
      values.push(currency);
    }
    if (invoice_date !== undefined) {
      updates.push(`invoice_date = $${paramCount++}`);
      values.push(invoice_date);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(due_date || null);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification à apporter' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    res.json({ invoice: result.rows[0] });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete invoice
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Récupérer le chemin du fichier
    const invoice = await pool.query('SELECT file_path FROM invoices WHERE id = $1', [id]);

    if (invoice.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    // Supprimer le fichier
    if (invoice.rows[0].file_path && fs.existsSync(invoice.rows[0].file_path)) {
      fs.unlinkSync(invoice.rows[0].file_path);
    }

    // Supprimer de la base de données
    await pool.query('DELETE FROM invoices WHERE id = $1', [id]);

    res.json({ message: 'Facture supprimée' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Download invoice file
router.get('/:id/file', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT i.*, c.created_by, c.user_id 
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    const invoice = result.rows[0];

    // Vérifier les permissions
    if (req.userRole === 'client') {
      if (invoice.user_id !== req.userId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }

    if (!invoice.file_path || !fs.existsSync(invoice.file_path)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Déterminer le nom du fichier avec l'extension appropriée
    const fileExt = path.extname(invoice.file_path);
    const fileName = `${invoice.invoice_number || `invoice-${invoice.id}`}${fileExt}`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(path.resolve(invoice.file_path));
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

