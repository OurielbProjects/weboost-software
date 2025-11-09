import nodemailer from 'nodemailer';
import { generateReport, ReportData } from './reportRenderer';

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter() {
  if (!transporter) {
    // Si les variables SMTP ne sont pas configurées, créer un transport de test
    if (!process.env.SMTP_HOST) {
      console.warn('⚠️ SMTP not configured, using test transport');
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'test',
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string, from?: string) {
  try {
    const transporter = getEmailTransporter();
    await transporter.sendMail({
      from: from || process.env.SMTP_FROM || 'WeBoost Software <noreply@weboost.com>',
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendReportEmail(
  type: string,
  recipients: string[],
  subject: string,
  data: ReportData,
  userId?: number
) {
  try {
    let supportEmail: string | undefined;
    let alertEmail: string | undefined;
    
    // Récupérer les paramètres de l'utilisateur (logo, infos entreprise, emails)
    if (userId) {
      const { pool } = await import('../database/connection');
      const settingsResult = await pool.query(
        'SELECT * FROM settings WHERE user_id = $1',
        [userId]
      );
      
      if (settingsResult.rows.length > 0) {
        const settings = settingsResult.rows[0];
        data.company = {
          name: settings.company_name || '',
          email: settings.company_email || '',
          phone: settings.company_phone || '',
          address: settings.company_address || '',
        };
        
        // Récupérer les emails de support et d'alerte
        supportEmail = settings.support_email;
        alertEmail = settings.alert_email;
        
        // Ajouter l'URL du logo si disponible
        if (settings.logo_path) {
          // Convertir le logo en base64 pour les emails (meilleure compatibilité)
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
              data.company.logo_url = `data:${mimeType};base64,${logoBase64}`;
            } else {
              // Fallback sur URL si le fichier n'existe pas
              data.company.logo_url = `${process.env.API_URL || 'http://localhost:5000'}/api/settings/logo/${userId}`;
            }
          } catch (error) {
            console.error('Error converting logo to base64:', error);
            // Fallback sur URL en cas d'erreur
            data.company.logo_url = `${process.env.API_URL || 'http://localhost:5000'}/api/settings/logo/${userId}`;
          }
        }
      }
    }
    
    // Pour les alertes bugs, utiliser alert_email comme destinataire si configuré
    let actualRecipients = recipients;
    if (type === 'bugs' && alertEmail) {
      actualRecipients = [alertEmail];
      console.log(`📧 Alerte bug: envoi à ${alertEmail} au lieu des destinataires configurés`);
    }
    
    // Préparer l'expéditeur
    const fromEmail = supportEmail 
      ? `${data.company?.name || 'WeBoost'} <${supportEmail}>`
      : process.env.SMTP_FROM || 'WeBoost Software <noreply@weboost.com>';
    
    // Générer le rapport HTML à partir du template
    const html = await generateReport(type, data);
    
    if (!html) {
      console.error(`Failed to generate report for type: ${type}`);
      return false;
    }

    // Créer une version texte simple
    const text = `
Rapport pour ${data.project.domain}
Client: ${data.customer.name}

${subject}

Consultez la version HTML de cet email pour plus de détails.
    `.trim();

    // Envoyer l'email à tous les destinataires
    const results = await Promise.all(
      actualRecipients.map(recipient => sendEmail(recipient, subject, text, html, fromEmail))
    );

    return results.every(result => result === true);
  } catch (error) {
    console.error('Error sending report email:', error);
    return false;
  }
}


