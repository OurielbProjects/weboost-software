import express from 'express';
import { pool } from '../database/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { ReportData } from '../utils/reportRenderer';

const router = express.Router();

// Get all report templates
router.get('/templates', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM report_templates ORDER BY type ASC'
    );
    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get template by type
router.get('/templates/:type', authenticate, requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const result = await pool.query(
      'SELECT * FROM report_templates WHERE type = $1',
      [type]
    );

    if (result.rows.length === 0) {
      // Retourner un template par défaut si aucun n'existe
      return res.json({ 
        template: {
          type,
          name: type === 'bugs' ? 'Rapport de bugs' : 
                type === 'weekly_report' ? 'Rapport hebdomadaire' : 
                'Rapport mensuel',
          html_template: getDefaultTemplate(type),
          css_styles: getDefaultCSS(),
        }
      });
    }

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create or update template
router.post('/templates', authenticate, requireAdmin, async (req, res) => {
  try {
    const { type, name, html_template, css_styles } = req.body;

    if (!type || !name || !html_template) {
      return res.status(400).json({ error: 'Type, nom et template HTML sont requis' });
    }

    // Vérifier si un template de ce type existe déjà
    const existing = await pool.query(
      'SELECT id FROM report_templates WHERE type = $1',
      [type]
    );

    let result;
    if (existing.rows.length > 0) {
      // Mettre à jour
      result = await pool.query(
        `UPDATE report_templates SET
          name = $1, html_template = $2, css_styles = $3, updated_at = CURRENT_TIMESTAMP
          WHERE type = $4 RETURNING *`,
        [name, html_template, css_styles || '', type]
      );
    } else {
      // Créer
      result = await pool.query(
        `INSERT INTO report_templates (type, name, html_template, css_styles)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [type, name, html_template, css_styles || '']
      );
    }

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Create/Update template error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Preview template with sample data
router.post('/preview/:type', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { type } = req.params;
    const { html_template, css_styles } = req.body;

    // Récupérer le template ou utiliser celui fourni
    let template;
    if (html_template) {
      template = { html_template, css_styles: css_styles || '' };
    } else {
      const templateResult = await pool.query(
        'SELECT * FROM report_templates WHERE type = $1',
        [type]
      );
      if (templateResult.rows.length === 0) {
        template = {
          html_template: getDefaultTemplate(type),
          css_styles: getDefaultCSS(),
        };
      } else {
        template = templateResult.rows[0];
      }
    }

    // Récupérer les données de l'utilisateur depuis les settings
    const sampleData = await getSampleDataWithSettings(type, req.userId);
    const rendered = renderTemplate(template.html_template, template.css_styles, sampleData);

    res.json({ html: rendered });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Helper functions
function getDefaultTemplate(type: string): string {
  if (type === 'bugs') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de Bugs - {{project.domain}}</title>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header avec logo -->
      <div class="header">
        <div class="logo-container">
          {{company.logo}}
        </div>
        <div class="header-info">
          <h1 class="report-title">🚨 Rapport de Bugs</h1>
          <p class="report-subtitle">{{project.domain}}</p>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="content">
        <p class="greeting">Bonjour <strong>{{customer.name}}</strong>,</p>
        <p class="intro">Nous avons détecté des problèmes nécessitant votre attention sur votre site web :</p>
        
        <div class="alerts-section">
          <h2 class="section-title">Alertes détectées</h2>
          <div class="alerts-list">
            {{#alerts}}
            <div class="alert-item">
              <div class="alert-icon">⚠️</div>
              <div class="alert-content">
                <p class="alert-message">{{message}}</p>
                <span class="alert-date">{{date}}</span>
              </div>
            </div>
            {{/alerts}}
          </div>
        </div>

        <div class="action-box">
          <p class="action-text">Nous recommandons de traiter ces problèmes dans les plus brefs délais pour maintenir la qualité de votre site.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="signature">Cordialement,<br><strong>{{company.name}}</strong></p>
        {{#company.email}}<p class="contact-info">📧 {{company.email}}</p>{{/company.email}}
        {{#company.phone}}<p class="contact-info">📞 {{company.phone}}</p>{{/company.phone}}
        {{#company.address}}<p class="contact-info">📍 {{company.address}}</p>{{/company.address}}
      </div>
    </div>
  </div>
</body>
</html>`;
  } else if (type === 'weekly_report') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Hebdomadaire - {{project.domain}}</title>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header avec logo -->
      <div class="header">
        <div class="logo-container">
          {{company.logo}}
        </div>
        <div class="header-info">
          <h1 class="report-title">📊 Rapport Hebdomadaire</h1>
          <p class="report-subtitle">{{project.domain}}</p>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="content">
        <p class="greeting">Bonjour <strong>{{customer.name}}</strong>,</p>
        <p class="intro">Voici le résumé de la semaine pour votre site web :</p>
        
        <div class="stats-grid">
          <div class="stat-card health">
            <div class="stat-icon">💚</div>
            <div class="stat-content">
              <p class="stat-label">Score de santé</p>
              <p class="stat-value">{{project.health_score}}%</p>
            </div>
          </div>
          <div class="stat-card traffic">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <p class="stat-label">Visiteurs</p>
              <p class="stat-value">{{traffic.visitors}}</p>
            </div>
          </div>
          <div class="stat-card views">
            <div class="stat-icon">📄</div>
            <div class="stat-content">
              <p class="stat-label">Pages vues</p>
              <p class="stat-value">{{traffic.pageviews}}</p>
            </div>
          </div>
        </div>

        <div class="info-box">
          <p class="info-text">Votre site continue de bien performer cette semaine. Continuez ainsi !</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="signature">Cordialement,<br><strong>{{company.name}}</strong></p>
        {{#company.email}}<p class="contact-info">📧 {{company.email}}</p>{{/company.email}}
        {{#company.phone}}<p class="contact-info">📞 {{company.phone}}</p>{{/company.phone}}
        {{#company.address}}<p class="contact-info">📍 {{company.address}}</p>{{/company.address}}
      </div>
    </div>
  </div>
</body>
</html>`;
  } else {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Mensuel - {{project.domain}}</title>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header avec logo -->
      <div class="header">
        <div class="logo-container">
          {{company.logo}}
        </div>
        <div class="header-info">
          <h1 class="report-title">📈 Rapport Mensuel</h1>
          <p class="report-subtitle">{{project.domain}}</p>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="content">
        <p class="greeting">Bonjour <strong>{{customer.name}}</strong>,</p>
        <p class="intro">Voici le résumé du mois pour votre site web :</p>
        
        <div class="stats-grid">
          <div class="stat-card health">
            <div class="stat-icon">💚</div>
            <div class="stat-content">
              <p class="stat-label">Score de santé moyen</p>
              <p class="stat-value">{{project.health_score}}%</p>
            </div>
          </div>
          <div class="stat-card performance">
            <div class="stat-icon">⚡</div>
            <div class="stat-content">
              <p class="stat-label">Performance</p>
              <p class="stat-value">{{performance.score}}</p>
            </div>
          </div>
          <div class="stat-card loadtime">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <p class="stat-label">Temps de chargement</p>
              <p class="stat-value">{{performance.loadTime}}s</p>
            </div>
          </div>
        </div>

        <div class="summary-box">
          <h2 class="section-title">Résumé mensuel</h2>
          <p class="summary-text">Votre site a maintenu de bonnes performances tout au long du mois. Nous continuons de surveiller et d'optimiser pour vous offrir la meilleure expérience possible.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="signature">Cordialement,<br><strong>{{company.name}}</strong></p>
        {{#company.email}}<p class="contact-info">📧 {{company.email}}</p>{{/company.email}}
        {{#company.phone}}<p class="contact-info">📞 {{company.phone}}</p>{{/company.phone}}
        {{#company.address}}<p class="contact-info">📍 {{company.address}}</p>{{/company.address}}
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}

function getDefaultCSS(): string {
  return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background-color: #f3f4f6;
  padding: 20px;
}

.email-wrapper {
  max-width: 650px;
  margin: 0 auto;
  background-color: #ffffff;
}

.email-container {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Header */
.header {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  padding: 30px;
  text-align: center;
  color: #ffffff;
}

.logo-container {
  margin-bottom: 20px;
}

.logo-container img {
  max-width: 180px;
  max-height: 80px;
  height: auto;
  display: block;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 8px;
}

.header-info {
  margin-top: 15px;
}

.report-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #ffffff;
}

.report-subtitle {
  font-size: 16px;
  opacity: 0.95;
  color: #ffffff;
}

/* Content */
.content {
  padding: 40px 30px;
}

.greeting {
  font-size: 18px;
  margin-bottom: 15px;
  color: #1f2937;
}

.intro {
  font-size: 16px;
  color: #4b5563;
  margin-bottom: 30px;
  line-height: 1.7;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 2px solid #e2e8f0;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.health {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.stat-card.traffic {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.stat-card.views {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
}

.stat-card.performance {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.stat-card.loadtime {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

/* Alerts Section */
.alerts-section {
  margin: 30px 0;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.alert-item {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: 18px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  transition: background 0.2s;
}

.alert-item:hover {
  background: #fde68a;
}

.alert-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 15px;
  color: #92400e;
  font-weight: 500;
  margin-bottom: 5px;
}

.alert-date {
  font-size: 13px;
  color: #78350f;
  opacity: 0.8;
}

/* Info/Summary Boxes */
.info-box, .action-box, .summary-box {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-left: 4px solid #0ea5e9;
  border-radius: 8px;
  padding: 20px;
  margin: 30px 0;
}

.action-box {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-left-color: #ef4444;
}

.summary-box {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-left-color: #10b981;
}

.info-text, .action-text, .summary-text {
  font-size: 15px;
  color: #1e40af;
  line-height: 1.7;
  margin: 0;
}

.action-text {
  color: #991b1b;
}

.summary-text {
  color: #065f46;
}

/* Footer */
.footer {
  background: #f9fafb;
  padding: 30px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

.signature {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 15px;
  line-height: 1.8;
}

.contact-info {
  font-size: 14px;
  color: #6b7280;
  margin: 5px 0;
}

/* Responsive */
@media only screen and (max-width: 600px) {
  .content {
    padding: 25px 20px;
  }
  
  .header {
    padding: 25px 20px;
  }
  
  .report-title {
    font-size: 24px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 15px;
  }
}`;
}

async function getSampleDataWithSettings(type: string, userId?: number): Promise<any> {
  const sampleData: any = {
    project: {
      domain: 'example.com',
      url: 'https://example.com',
      health_score: 85,
      status: 'active',
    },
    customer: {
      name: 'BarouhAba',
      email: 'contact@barouhaba.com',
    },
    traffic: {
      visitors: 1250,
      pageviews: 3420,
    },
    performance: {
      score: 92,
      loadTime: 1.2,
    },
    alerts: [
      { message: 'Lien cassé détecté', date: '2024-01-15' },
      { message: 'Image trop lourde', date: '2024-01-14' },
    ],
    company: {
      name: 'WeBoost',
      email: 'contact@weboost.com',
      phone: '+33 1 23 45 67 89',
      address: '123 Rue Example, 75001 Paris',
      logo_url: '/api/settings/logo/1',
    },
  };

  // Si un userId est fourni, récupérer les vraies données depuis les settings
  if (userId) {
    try {
      const settingsResult = await pool.query(
        'SELECT * FROM settings WHERE user_id = $1',
        [userId]
      );

      if (settingsResult.rows.length > 0) {
        const settings = settingsResult.rows[0];
        
        // Récupérer les informations de l'entreprise depuis les settings
        sampleData.company = {
          name: settings.company_name || sampleData.company.name,
          email: settings.company_email || sampleData.company.email,
          phone: settings.company_phone || sampleData.company.phone,
          address: settings.company_address || sampleData.company.address,
        };

        // Récupérer le logo si disponible
        if (settings.logo_path) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const logoPath = path.resolve(settings.logo_path);
            if (fs.existsSync(logoPath)) {
              const logoBuffer = fs.readFileSync(logoPath);
              const logoBase64 = logoBuffer.toString('base64');
              const ext = path.extname(logoPath).toLowerCase().replace('.', '');
              const mimeType = ext === 'png' ? 'image/png' : 
                              ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 
                              ext === 'gif' ? 'image/gif' : 
                              ext === 'svg' ? 'image/svg+xml' : 'image/png';
              sampleData.company.logo_url = `data:${mimeType};base64,${logoBase64}`;
            } else {
              sampleData.company.logo_url = `${process.env.API_URL || 'http://localhost:5000'}/api/settings/logo/${userId}`;
            }
          } catch (error) {
            console.error('Error converting logo to base64 in preview:', error);
            sampleData.company.logo_url = `${process.env.API_URL || 'http://localhost:5000'}/api/settings/logo/${userId}`;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings for preview:', error);
      // Continuer avec les données d'exemple en cas d'erreur
    }
  }

  return sampleData;
}

function getSampleData(type: string): any {
  return {
    project: {
      domain: 'example.com',
      url: 'https://example.com',
      health_score: 85,
      status: 'active',
    },
    customer: {
      name: 'BarouhAba',
      email: 'contact@barouhaba.com',
    },
    traffic: {
      visitors: 1250,
      pageviews: 3420,
    },
    performance: {
      score: 92,
      loadTime: 1.2,
    },
    alerts: [
      { message: 'Lien cassé détecté', date: '2024-01-15' },
      { message: 'Image trop lourde', date: '2024-01-14' },
    ],
    company: {
      name: 'WeBoost',
      email: 'contact@weboost.com',
      phone: '+33 1 23 45 67 89',
      address: '123 Rue Example, 75001 Paris',
      logo_url: '/api/settings/logo/1',
    },
  };
}

function renderTemplate(html: string, css: string, data: any): string {
  // Remplacer les variables {{variable}}
  let rendered = html;
  
  // ÉTAPE 1: Gérer les conditions AVANT de remplacer les variables simples
  // Gérer les conditions {{#company.field}}...{{/company.field}}
  if (data.company) {
    const companyConditionRegex = /\{\{#company\.(\w+)\}\}([\s\S]*?)\{\{\/company\.\1\}\}/g;
    rendered = rendered.replace(companyConditionRegex, (match, field, content) => {
      const value = data.company[field];
      // Vérifier si la valeur existe et n'est pas vide
      if (value && String(value).trim() !== '') {
        // Remplacer les variables dans le contenu de la condition
        let processedContent = content;
        processedContent = processedContent.replace(/\{\{company\.(\w+)\}\}/g, (m, f) => {
          return String(data.company[f] || '');
        });
        return processedContent;
      }
      return '';
    });
  }

  // Gérer les boucles {{#alerts}}...{{/alerts}}
  const loopRegex = /\{\{#alerts\}\}([\s\S]*?)\{\{\/alerts\}\}/g;
  rendered = rendered.replace(loopRegex, (match, content) => {
    if (!data.alerts || !Array.isArray(data.alerts)) {
      return '';
    }
    return data.alerts.map((alert: any) => {
      let itemContent = content;
      itemContent = itemContent.replace(/\{\{message\}\}/g, String(alert.message || ''));
      itemContent = itemContent.replace(/\{\{date\}\}/g, String(alert.date || ''));
      return itemContent;
    }).join('');
  });
  
  // ÉTAPE 2: Remplacer les variables simples
  rendered = rendered.replace(/\{\{project\.domain\}\}/g, String(data.project?.domain || ''));
  rendered = rendered.replace(/\{\{project\.url\}\}/g, String(data.project?.url || ''));
  rendered = rendered.replace(/\{\{project\.health_score\}\}/g, String(data.project?.health_score || ''));
  rendered = rendered.replace(/\{\{project\.status\}\}/g, String(data.project?.status || ''));
  
  rendered = rendered.replace(/\{\{customer\.name\}\}/g, String(data.customer?.name || ''));
  rendered = rendered.replace(/\{\{customer\.email\}\}/g, String(data.customer?.email || ''));
  
  rendered = rendered.replace(/\{\{traffic\.visitors\}\}/g, String(data.traffic?.visitors || ''));
  rendered = rendered.replace(/\{\{traffic\.pageviews\}\}/g, String(data.traffic?.pageviews || ''));
  
  rendered = rendered.replace(/\{\{performance\.score\}\}/g, String(data.performance?.score || ''));
  rendered = rendered.replace(/\{\{performance\.loadTime\}\}/g, String(data.performance?.loadTime || ''));
  
  // Remplacer les variables de l'entreprise (celles qui n'ont pas été traitées dans les conditions)
  if (data.company) {
    rendered = rendered.replace(/\{\{company\.name\}\}/g, String(data.company.name || ''));
    rendered = rendered.replace(/\{\{company\.email\}\}/g, String(data.company.email || ''));
    rendered = rendered.replace(/\{\{company\.phone\}\}/g, String(data.company.phone || ''));
    rendered = rendered.replace(/\{\{company\.address\}\}/g, String(data.company.address || ''));
    
    // Remplacer le logo
    if (data.company.logo_url) {
      const logoHtml = `<img src="${data.company.logo_url}" alt="Logo" style="max-width: 180px; max-height: 80px; height: auto; display: block; margin: 0 auto; background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px;" />`;
      rendered = rendered.replace(/\{\{company\.logo\}\}/g, logoHtml);
    } else {
      rendered = rendered.replace(/\{\{company\.logo\}\}/g, '');
    }
  } else {
    rendered = rendered.replace(/\{\{company\.name\}\}/g, '');
    rendered = rendered.replace(/\{\{company\.email\}\}/g, '');
    rendered = rendered.replace(/\{\{company\.phone\}\}/g, '');
    rendered = rendered.replace(/\{\{company\.address\}\}/g, '');
    rendered = rendered.replace(/\{\{company\.logo\}\}/g, '');
  }
  
  // Injecter le CSS dans le head
  if (css) {
    if (rendered.includes('</head>')) {
      rendered = rendered.replace('</head>', `<style>${css}</style></head>`);
    } else if (rendered.includes('<head>')) {
      rendered = rendered.replace('<head>', `<head><style>${css}</style>`);
    } else {
      // Si pas de head, ajouter avant le body ou au début
      if (rendered.includes('<body>')) {
        rendered = rendered.replace('<body>', `<head><style>${css}</style></head><body>`);
      } else {
        rendered = `<head><style>${css}</style></head>${rendered}`;
      }
    }
  }
  
  return rendered;
}

export default router;

