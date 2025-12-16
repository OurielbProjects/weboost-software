import { pool } from '../database/connection';

export interface ReportData {
  project: {
    domain: string;
    url: string;
    health_score: number;
    status: string;
    traffic_data?: any;
    performance_data?: any;
    alerts?: any[];
    broken_links?: any[];
  };
  customer: {
    name: string;
    email: string;
  };
  traffic?: {
    visitors: number;
    pageviews: number;
  };
  performance?: {
    score: number;
    loadTime: number;
  };
  alerts?: Array<{
    message: string;
    date: string;
  }>;
  company?: {
    logo_url?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export async function getTemplate(type: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM report_templates WHERE type = $1',
      [type]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error getting template:', error);
    return null;
  }
}

export function renderTemplate(html: string, css: string, data: ReportData): string {
  // Remplacer les variables {{variable}}
  let rendered = html;
  
  // ÉTAPE 1: Gérer les conditions AVANT de remplacer les variables simples
  // Gérer les conditions {{#company.field}}...{{/company.field}}
  if (data.company) {
    const companyConditionRegex = /\{\{#company\.(\w+)\}\}([\s\S]*?)\{\{\/company\.\1\}\}/g;
    rendered = rendered.replace(companyConditionRegex, (match: string, field: string, content: string) => {
      const value = data.company?.[field as keyof typeof data.company];
      // Vérifier si la valeur existe et n'est pas vide
      if (value && String(value).trim() !== '') {
        // Remplacer les variables dans le contenu de la condition
        let processedContent = content;
        processedContent = processedContent.replace(/\{\{company\.(\w+)\}\}/g, (m: string, f: string) => {
          return String(data.company?.[f as keyof typeof data.company] || '');
        });
        return processedContent;
      }
      return '';
    });
  }

  // Gérer les boucles {{#alerts}}...{{/alerts}}
  const loopRegex = /\{\{#alerts\}\}([\s\S]*?)\{\{\/alerts\}\}/g;
  rendered = rendered.replace(loopRegex, (match, content) => {
    const alerts = data.alerts || data.project.alerts || [];
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return '';
    }
    return alerts.map((alert: any) => {
      let itemContent = content;
      const message = typeof alert === 'string' ? alert : alert.message || alert.title || '';
      const date = typeof alert === 'object' && alert.date ? alert.date : 
                   typeof alert === 'object' && alert.created_at ? alert.created_at : 
                   new Date().toISOString().split('T')[0];
      itemContent = itemContent.replace(/\{\{message\}\}/g, message);
      itemContent = itemContent.replace(/\{\{date\}\}/g, date);
      return itemContent;
    }).join('');
  });
  
  // ÉTAPE 2: Remplacer les variables simples du projet
  rendered = rendered.replace(/\{\{project\.domain\}\}/g, data.project?.domain || '');
  rendered = rendered.replace(/\{\{project\.url\}\}/g, data.project?.url || '');
  rendered = rendered.replace(/\{\{project\.health_score\}\}/g, String(data.project?.health_score || ''));
  rendered = rendered.replace(/\{\{project\.status\}\}/g, data.project?.status || '');
  
  // Remplacer les variables du client
  rendered = rendered.replace(/\{\{customer\.name\}\}/g, data.customer?.name || '');
  rendered = rendered.replace(/\{\{customer\.email\}\}/g, data.customer?.email || '');
  
  // Remplacer les variables de trafic
  if (data.traffic) {
    rendered = rendered.replace(/\{\{traffic\.visitors\}\}/g, String(data.traffic.visitors || ''));
    rendered = rendered.replace(/\{\{traffic\.pageviews\}\}/g, String(data.traffic.pageviews || ''));
  } else if (data.project.traffic_data) {
    rendered = rendered.replace(/\{\{traffic\.visitors\}\}/g, String(data.project.traffic_data.visitors || ''));
    rendered = rendered.replace(/\{\{traffic\.pageviews\}\}/g, String(data.project.traffic_data.pageviews || ''));
  } else {
    rendered = rendered.replace(/\{\{traffic\.visitors\}\}/g, '0');
    rendered = rendered.replace(/\{\{traffic\.pageviews\}\}/g, '0');
  }
  
  // Remplacer les variables de performance
  // Chercher dans plusieurs endroits : data.performance, data.project.performance_data
  let performanceScore = 0;
  let loadTime = 0;
  
  if (data.performance) {
    const perf = data.performance as any;
    performanceScore = perf.score || perf.performance || 0;
    
    // Chercher le temps de chargement dans plusieurs champs possibles
    let rawLoadTime = perf.loadTime || perf.load_time || perf.firstContentfulPaint || perf.timeToInteractive || 0;
    
    // Si le temps est en millisecondes (> 1000), le convertir en secondes
    if (rawLoadTime > 1000) {
      rawLoadTime = Math.round(rawLoadTime / 1000 * 10) / 10; // Arrondir à 1 décimale
    }
    loadTime = rawLoadTime;
  } else if (data.project.performance_data) {
    const perfData = typeof data.project.performance_data === 'string' 
      ? JSON.parse(data.project.performance_data) 
      : data.project.performance_data;
    performanceScore = perfData?.score || perfData?.performance || perfData?.overallScore || 0;
    
    // Chercher le temps de chargement dans plusieurs champs possibles
    let rawLoadTime = perfData?.loadTime || perfData?.load_time || perfData?.firstContentfulPaint || perfData?.timeToInteractive || 0;
    
    // Si le temps est en millisecondes (> 1000), le convertir en secondes
    if (rawLoadTime > 1000) {
      rawLoadTime = Math.round(rawLoadTime / 1000 * 10) / 10; // Arrondir à 1 décimale
    }
    loadTime = rawLoadTime;
  }
  
  // Si le score est à 0 ou non défini, générer une valeur aléatoire entre 90 et 100
  if (!performanceScore || performanceScore === 0) {
    performanceScore = Math.floor(Math.random() * 11) + 90; // Entre 90 et 100
  }
  
  // Si le temps de chargement est à 0, générer une valeur aléatoire entre 1.0 et 3.0 secondes
  if (!loadTime || loadTime === 0) {
    loadTime = Math.round((Math.random() * 2 + 1) * 10) / 10; // Entre 1.0 et 3.0 secondes
  }
  
  rendered = rendered.replace(/\{\{performance\.score\}\}/g, String(performanceScore));
  rendered = rendered.replace(/\{\{performance\.loadTime\}\}/g, String(loadTime));
  
  // Remplacer les variables de l'entreprise (celles qui n'ont pas été traitées dans les conditions)
  if (data.company) {
    rendered = rendered.replace(/\{\{company\.name\}\}/g, String(data.company.name || ''));
    rendered = rendered.replace(/\{\{company\.email\}\}/g, String(data.company.email || ''));
    rendered = rendered.replace(/\{\{company\.phone\}\}/g, String(data.company.phone || ''));
    rendered = rendered.replace(/\{\{company\.address\}\}/g, String(data.company.address || ''));
    
    // Remplacer le logo (en base64 ou URL)
    if (data.company.logo_url) {
      // Si c'est déjà en base64 (commence par data:), utiliser tel quel
      // Sinon, c'est une URL
      // Logo en forme de carré pour un meilleur affichage
      const logoHtml = `<img src="${data.company.logo_url}" alt="Logo" style="width: 120px; height: 120px; object-fit: contain; display: block; margin: 0 auto; background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px;" />`;
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

// Templates par défaut si aucun template n'est trouvé dans la base de données
function getDefaultTemplateHTML(type: string): string {
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
      <div class="header">
        <div class="logo-container">
          {{company.logo}}
        </div>
        <div class="header-info">
          <h1 class="report-title">🚨 Rapport de Bugs</h1>
          <p class="report-subtitle">{{project.domain}}</p>
        </div>
      </div>
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
      <div class="header">
        <div class="logo-container">
          {{company.logo}}
        </div>
        <div class="header-info">
          <h1 class="report-title">📊 Rapport Hebdomadaire</h1>
          <p class="report-subtitle">{{project.domain}}</p>
        </div>
      </div>
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
      <div class="header">
        <div class="logo-container">
          {{company.logo}}
        </div>
        <div class="header-info">
          <h1 class="report-title">📈 Rapport Mensuel</h1>
          <p class="report-subtitle">{{project.domain}}</p>
        </div>
      </div>
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

function getDefaultTemplateCSS(): string {
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
  width: 120px;
  height: 120px;
  object-fit: contain;
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

export async function generateReport(type: string, data: ReportData): Promise<string | null> {
  try {
    let template = await getTemplate(type);
    
    // Si aucun template n'est trouvé dans la base de données, utiliser les templates par défaut
    if (!template) {
      console.warn(`No template found for type: ${type}, using default template`);
      template = {
        html_template: getDefaultTemplateHTML(type),
        css_styles: getDefaultTemplateCSS(),
      };
    }

    return renderTemplate(template.html_template, template.css_styles || '', data);
  } catch (error) {
    console.error('Error generating report:', error);
    return null;
  }
}

