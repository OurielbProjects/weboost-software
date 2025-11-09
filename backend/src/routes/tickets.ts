import express from 'express';
import { pool } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all tickets
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    let query = `
      SELECT t.*, c.name as customer_name, c.email as customer_email,
             u.name as user_name, u.email as user_email
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.user_id = u.id
    `;
    const params: any[] = [];

    // Les clients ne voient que leurs propres tickets
    if (req.userRole === 'client') {
      query += ` WHERE c.user_id = $1`;
      params.push(req.userId);
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ tickets: result.rows });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get ticket by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    let query = `
      SELECT t.*, c.name as customer_name, c.email as customer_email,
             u.name as user_name, u.email as user_email
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `;
    const params: any[] = [id];

    // Les clients ne voient que leurs propres tickets
    if (req.userRole === 'client') {
      query += ` AND c.user_id = $2`;
      params.push(req.userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    // Récupérer les commentaires
    const commentsResult = await pool.query(
      `SELECT tc.*, u.name as user_name, u.email as user_email
       FROM ticket_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.ticket_id = $1
       ORDER BY tc.created_at ASC`,
      [id]
    );

    res.json({
      ticket: result.rows[0],
      comments: commentsResult.rows
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create ticket
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { customer_id, title, description, priority = 'medium' } = req.body;

    if (!customer_id || !title || !description) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier que le client peut créer un ticket pour ce customer
    if (req.userRole === 'client') {
      const customerCheck = await pool.query(
        'SELECT id FROM customers WHERE id = $1 AND user_id = $2',
        [customer_id, req.userId]
      );
      if (customerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }

    const result = await pool.query(
      `INSERT INTO tickets (customer_id, user_id, title, description, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [customer_id, req.userId, title, description, priority]
    );

    res.status(201).json({ ticket: result.rows[0] });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update ticket
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;

    // Vérifier les permissions
    const ticketCheck = await pool.query(
      `SELECT t.*, c.user_id as customer_user_id
       FROM tickets t
       LEFT JOIN customers c ON t.customer_id = c.id
       WHERE t.id = $1`,
      [id]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    const ticket = ticketCheck.rows[0];

    // Les clients ne peuvent modifier que leurs propres tickets et seulement certains champs
    if (req.userRole === 'client') {
      if (ticket.customer_user_id !== req.userId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
      // Les clients ne peuvent pas changer le statut
      if (status !== undefined) {
        return res.status(403).json({ error: 'Vous ne pouvez pas modifier le statut' });
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined && req.userRole === 'admin') {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
      if (status === 'resolved' || status === 'closed') {
        updates.push(`resolved_at = CURRENT_TIMESTAMP`);
      }
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification à apporter' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json({ ticket: result.rows[0] });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Add comment to ticket
router.post('/:id/comments', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'Le commentaire est requis' });
    }

    // Vérifier les permissions
    const ticketCheck = await pool.query(
      `SELECT t.*, c.user_id as customer_user_id
       FROM tickets t
       LEFT JOIN customers c ON t.customer_id = c.id
       WHERE t.id = $1`,
      [id]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    const ticket = ticketCheck.rows[0];

    // Les clients ne peuvent commenter que leurs propres tickets
    if (req.userRole === 'client' && ticket.customer_user_id !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const result = await pool.query(
      `INSERT INTO ticket_comments (ticket_id, user_id, comment)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, req.userId, comment]
    );

    res.status(201).json({ comment: result.rows[0] });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete ticket (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    res.json({ message: 'Ticket supprimé' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

