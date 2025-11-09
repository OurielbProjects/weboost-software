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
  if (data.performance) {
    rendered = rendered.replace(/\{\{performance\.score\}\}/g, String(data.performance.score || ''));
    rendered = rendered.replace(/\{\{performance\.loadTime\}\}/g, String(data.performance.loadTime || ''));
  } else if (data.project.performance_data) {
    rendered = rendered.replace(/\{\{performance\.score\}\}/g, String(data.project.performance_data.score || ''));
    rendered = rendered.replace(/\{\{performance\.loadTime\}\}/g, String(data.project.performance_data.loadTime || ''));
  } else {
    rendered = rendered.replace(/\{\{performance\.score\}\}/g, '0');
    rendered = rendered.replace(/\{\{performance\.loadTime\}\}/g, '0');
  }
  
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

export async function generateReport(type: string, data: ReportData): Promise<string | null> {
  try {
    const template = await getTemplate(type);
    
    if (!template) {
      console.warn(`No template found for type: ${type}`);
      return null;
    }

    return renderTemplate(template.html_template, template.css_styles || '', data);
  } catch (error) {
    console.error('Error generating report:', error);
    return null;
  }
}

