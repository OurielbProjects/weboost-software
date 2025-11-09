import express from 'express';
import { pool } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendReportEmail, ReportData } from '../utils/email';

const router = express.Router();

// Get all notifications for a project
router.get('/project/:projectId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    
    // Vérifier que l'utilisateur a accès au projet
    const projectCheck = await pool.query(
      `SELECT p.*, c.user_id as customer_user_id
       FROM projects p
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    const project = projectCheck.rows[0];

    // Les clients ne voient que leurs propres projets
    if (req.userRole === 'client' && project.customer_user_id !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const result = await pool.query(
      'SELECT * FROM notifications WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create or update notification for a project
router.post('/project/:projectId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const {
      type,
      enabled = true,
      frequency = 'weekly',
      recipients = [],
      settings = {}
    } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Le type est requis' });
    }

    // Vérifier que l'utilisateur a accès au projet
    const projectCheck = await pool.query(
      `SELECT p.*, c.user_id as customer_user_id
       FROM projects p
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    const project = projectCheck.rows[0];

    // Les clients ne voient que leurs propres projets
    if (req.userRole === 'client' && project.customer_user_id !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier si une notification de ce type existe déjà pour ce projet
    const existing = await pool.query(
      'SELECT id FROM notifications WHERE project_id = $1 AND type = $2',
      [projectId, type]
    );

    let result;
    if (existing.rows.length > 0) {
      // Mettre à jour
      result = await pool.query(
        `UPDATE notifications SET
          enabled = $1, frequency = $2, recipients = $3, settings = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5 RETURNING *`,
        [
          enabled,
          frequency,
          JSON.stringify(recipients),
          JSON.stringify(settings),
          existing.rows[0].id
        ]
      );
    } else {
      // Créer
      result = await pool.query(
        `INSERT INTO notifications (project_id, type, enabled, frequency, recipients, settings)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          projectId,
          type,
          enabled,
          frequency,
          JSON.stringify(recipients),
          JSON.stringify(settings)
        ]
      );
    }

    const notification = result.rows[0];

    // Si la notification est activée et qu'il y a des destinataires, envoyer un email de test (optionnel)
    // On peut ajouter une logique pour envoyer immédiatement si nécessaire
    // Pour l'instant, on sauvegarde juste la configuration

    res.json({ notification });
  } catch (error) {
    console.error('Create/Update notification error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Send notification email manually (for testing or immediate sending)
router.post('/send/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Récupérer la notification
    const notificationResult = await pool.query(
      `SELECT n.*, p.*, c.name as customer_name, c.email as customer_email
       FROM notifications n
       LEFT JOIN projects p ON n.project_id = p.id
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE n.id = $1`,
      [id]
    );

    if (notificationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    const notification = notificationResult.rows[0];

    // Vérifier les permissions
    const projectCheck = await pool.query(
      `SELECT p.*, c.user_id as customer_user_id
       FROM projects p
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE p.id = $1`,
      [notification.project_id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    const project = projectCheck.rows[0];

    if (req.userRole === 'client' && project.customer_user_id !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    if (!notification.enabled) {
      return res.status(400).json({ error: 'Notification désactivée' });
    }

    const recipients = Array.isArray(notification.recipients) 
      ? notification.recipients 
      : typeof notification.recipients === 'string' 
        ? JSON.parse(notification.recipients) 
        : [];

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'Aucun destinataire configuré' });
    }

    // Préparer les données pour le template
    const reportData: ReportData = {
      project: {
        domain: notification.domain || '',
        url: notification.url || '',
        health_score: notification.health_score || 100,
        status: notification.status || 'active',
        traffic_data: notification.traffic_data || {},
        performance_data: notification.performance_data || {},
        alerts: notification.alerts || [],
        broken_links: notification.broken_links || [],
      },
      customer: {
        name: notification.customer_name || '',
        email: notification.customer_email || '',
      },
      traffic: notification.traffic_data?.visitors 
        ? {
            visitors: notification.traffic_data.visitors,
            pageviews: notification.traffic_data.pageviews || 0,
          }
        : undefined,
      performance: notification.performance_data?.score
        ? {
            score: notification.performance_data.score,
            loadTime: notification.performance_data.loadTime || 0,
          }
        : undefined,
      alerts: Array.isArray(notification.alerts) ? notification.alerts : [],
    };

    // Générer le sujet de l'email
    const subject = notification.type === 'bugs' 
      ? `Rapport de bugs - ${notification.domain}`
      : notification.type === 'weekly_report'
        ? `Rapport hebdomadaire - ${notification.domain}`
        : `Rapport mensuel - ${notification.domain}`;

    // Envoyer l'email
    const success = await sendReportEmail(
      notification.type,
      recipients,
      subject,
      reportData,
      req.userId
    );

    if (success) {
      res.json({ message: 'Email envoyé avec succès', sent: true });
    } else {
      res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email', sent: false });
    }
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update notification
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { enabled, frequency, recipients, settings } = req.body;

    // Vérifier que l'utilisateur a accès au projet via la notification
    const notificationCheck = await pool.query(
      `SELECT n.*, p.*, c.user_id as customer_user_id
       FROM notifications n
       LEFT JOIN projects p ON n.project_id = p.id
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE n.id = $1`,
      [id]
    );

    if (notificationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    const notification = notificationCheck.rows[0];

    // Les clients ne voient que leurs propres projets
    if (req.userRole === 'client' && notification.customer_user_id !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (enabled !== undefined) {
      updates.push(`enabled = $${paramCount++}`);
      values.push(enabled);
    }
    if (frequency !== undefined) {
      updates.push(`frequency = $${paramCount++}`);
      values.push(frequency);
    }
    if (recipients !== undefined) {
      updates.push(`recipients = $${paramCount++}`);
      values.push(JSON.stringify(recipients));
    }
    if (settings !== undefined) {
      updates.push(`settings = $${paramCount++}`);
      values.push(JSON.stringify(settings));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification à apporter' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE notifications SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'utilisateur a accès au projet via la notification
    const notificationCheck = await pool.query(
      `SELECT n.*, p.*, c.user_id as customer_user_id
       FROM notifications n
       LEFT JOIN projects p ON n.project_id = p.id
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE n.id = $1`,
      [id]
    );

    if (notificationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    const notification = notificationCheck.rows[0];

    // Les clients ne voient que leurs propres projets
    if (req.userRole === 'client' && notification.customer_user_id !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 RETURNING id',
      [id]
    );

    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
