import express from 'express';
import { pool } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all checklist items for current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM checklist_items WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get checklist items error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get checklist item by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM checklist_items WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Élément non trouvé' });
    }

    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Get checklist item error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create checklist item
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description, priority = 'medium', deadline } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }

    const result = await pool.query(
      `INSERT INTO checklist_items (user_id, title, description, priority, deadline)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, title, description || null, priority, deadline || null]
    );

    res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    console.error('Create checklist item error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update checklist item
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed, priority, deadline } = req.body;

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
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      values.push(completed);
      if (completed) {
        updates.push(`completed_at = CURRENT_TIMESTAMP`);
      } else {
        updates.push(`completed_at = NULL`);
      }
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (deadline !== undefined) {
      updates.push(`deadline = $${paramCount++}`);
      values.push(deadline || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification à apporter' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.userId);

    const result = await pool.query(
      `UPDATE checklist_items SET ${updates.join(', ')} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Élément non trouvé' });
    }

    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Update checklist item error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete checklist item
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM checklist_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Élément non trouvé' });
    }

    res.json({ message: 'Élément supprimé' });
  } catch (error) {
    console.error('Delete checklist item error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;


