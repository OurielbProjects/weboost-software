import express from 'express';
import { pool } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { updateProjectData } from '../services/analyzer';

const router = express.Router();

// Get all projects
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    let query = `
      SELECT p.*, c.name as customer_name, c.email as customer_email
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
    `;
    const params: any[] = [];

    // Les clients ne voient que leurs propres projets
    if (req.userRole === 'client') {
      query += ` WHERE c.user_id = $1`;
      params.push(req.userId);
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get project by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    let query = `
      SELECT p.*, c.name as customer_name, c.email as customer_email
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `;
    const params: any[] = [id];

    // Les clients ne voient que leurs propres projets
    if (req.userRole === 'client') {
      query += ` AND c.user_id = $2`;
      params.push(req.userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create project (admin only)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const {
      customer_id,
      domain,
      url,
      status = 'active',
      traffic_data = {},
      broken_links = [],
      performance_data = {},
      alerts = [],
      server_status = {},
      health_score = 100
    } = req.body;

    if (!domain || !url) {
      return res.status(400).json({ error: 'Domain et URL sont requis' });
    }

    const result = await pool.query(
      `INSERT INTO projects (
        customer_id, domain, url, status, traffic_data, broken_links,
        performance_data, alerts, server_status, health_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [customer_id, domain, url, status, JSON.stringify(traffic_data), 
       JSON.stringify(broken_links), JSON.stringify(performance_data),
       JSON.stringify(alerts), JSON.stringify(server_status), health_score]
    );

    res.status(201).json({ project: result.rows[0] });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update project
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { id } = req.params;
    const {
      domain,
      url,
      status,
      traffic_data,
      broken_links,
      performance_data,
      alerts,
      server_status,
      health_score
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (domain !== undefined) {
      updates.push(`domain = $${paramCount++}`);
      values.push(domain);
    }
    if (url !== undefined) {
      updates.push(`url = $${paramCount++}`);
      values.push(url);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (traffic_data !== undefined) {
      updates.push(`traffic_data = $${paramCount++}`);
      values.push(JSON.stringify(traffic_data));
    }
    if (broken_links !== undefined) {
      updates.push(`broken_links = $${paramCount++}`);
      values.push(JSON.stringify(broken_links));
    }
    if (performance_data !== undefined) {
      updates.push(`performance_data = $${paramCount++}`);
      values.push(JSON.stringify(performance_data));
    }
    if (alerts !== undefined) {
      updates.push(`alerts = $${paramCount++}`);
      values.push(JSON.stringify(alerts));
    }
    if (server_status !== undefined) {
      updates.push(`server_status = $${paramCount++}`);
      values.push(JSON.stringify(server_status));
    }
    if (health_score !== undefined) {
      updates.push(`health_score = $${paramCount++}`);
      values.push(health_score);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification à apporter' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete project (admin only)
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { id } = req.params;
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    res.json({ message: 'Projet supprimé' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Analyze project (trigger analysis)
router.post('/:id/analyze', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'utilisateur a accès au projet
    const projectCheck = await pool.query(
      `SELECT p.*, c.user_id as customer_user_id
       FROM projects p
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    const project = projectCheck.rows[0];

    // Les clients ne voient que leurs propres projets
    if (req.userRole === 'client' && project.customer_user_id !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Lancer l'analyse en arrière-plan (sans attendre)
    updateProjectData(parseInt(id))
      .then(() => {
        console.log(`✅ Analyse terminée pour le projet ${id}`);
      })
      .catch((error) => {
        console.error(`❌ Erreur lors de l'analyse du projet ${id}:`, error);
      });

    // Répondre immédiatement pour ne pas bloquer
    res.json({ message: 'Analyse lancée en arrière-plan', status: 'processing' });
  } catch (error) {
    console.error('Analyze project error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

