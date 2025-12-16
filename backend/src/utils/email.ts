import nodemailer from 'nodemailer';
import axios from 'axios';
import { generateReport } from './reportRenderer';
import type { ReportData } from './reportRenderer';

export type { ReportData };

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
      const port = parseInt(process.env.SMTP_PORT || '587');
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;
      
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
        },
        connectionTimeout: 60000, // 60 secondes
        greetingTimeout: 30000, // 30 secondes
        socketTimeout: 60000, // 60 secondes
        tls: {
          rejectUnauthorized: false, // Permet les certificats auto-signés si nécessaire
        },
        debug: process.env.NODE_ENV === 'development', // Activer le debug en développement
        logger: process.env.NODE_ENV === 'development', // Logger les actions en développement
      });
    }
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string, from?: string) {
  try {
    // Si SendGrid API Key est configuré, utiliser SendGrid au lieu de SMTP
    if (process.env.SENDGRID_API_KEY) {
      return await sendEmailViaSendGrid(to, subject, text, html, from);
    }
    
    // Sinon, utiliser SMTP classique
    const transporter = getEmailTransporter();
    const mailOptions = {
      from: from || process.env.SMTP_FROM || 'WeBoost Software <noreply@weboost.com>',
      to,
      subject,
      text,
      html,
    };
    
    console.log(`📧 Tentative d'envoi d'email à ${to} via SMTP...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi d\'email:', error);
    console.error('   Détails:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      message: error.message,
    });
    return false;
  }
}

async function sendEmailViaSendGrid(to: string, subject: string, text: string, html?: string, from?: string): Promise<boolean> {
  try {
    // Utiliser SENDGRID_FROM si configuré, sinon SMTP_FROM, sinon l'email du compte SendGrid
    const fromEmail = from || process.env.SENDGRID_FROM || process.env.SMTP_FROM || process.env.SENDGRID_VERIFIED_EMAIL || 'WeBoost Software <noreply@weboost.com>';
    // Extraire l'email et le nom depuis "Nom <email@domain.com>" ou juste l'email
    let fromAddress = fromEmail;
    let fromName = 'WeBoost Software';
    
    const fromMatch = fromEmail.match(/^(.+?)\s*<(.+?)>$/);
    if (fromMatch) {
      fromName = fromMatch[1].trim();
      fromAddress = fromMatch[2].trim();
    } else {
      // Si c'est juste un email, extraire le nom du domaine
      fromAddress = fromEmail.trim();
      if (fromAddress.includes('@')) {
        const domain = fromAddress.split('@')[1];
        fromName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
      }
    }
    
    console.log(`📧 Tentative d'envoi d'email à ${to} via SendGrid API...`);
    
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject,
          },
        ],
        from: {
          email: fromAddress,
          name: fromName,
        },
        content: [
          {
            type: 'text/plain',
            value: text,
          },
          ...(html ? [{
            type: 'text/html',
            value: html,
          }] : []),
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 secondes
      }
    );
    
    if (response.status === 202) {
      console.log(`✅ Email envoyé avec succès à ${to} via SendGrid`);
      return true;
    } else {
      console.error(`❌ Erreur SendGrid: Status ${response.status}`);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi d\'email via SendGrid:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Message:', error.message);
    }
    return false;
  }
}

export async function sendReportEmail(
  type: string,
  recipients: string[],
  subject: string,
  data: ReportData,
  userId?: number,
  useAlertEmailForBugs: boolean = true
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
        
        // Initialiser data.company s'il n'existe pas
        if (!data.company) {
          data.company = {};
        }
        
        data.company.name = settings.company_name || '';
        data.company.email = settings.company_email || '';
        data.company.phone = settings.company_phone || '';
        data.company.address = settings.company_address || '';
        
        // Récupérer les emails de support et d'alerte
        supportEmail = settings.support_email;
        alertEmail = settings.alert_email;
        
        // Ajouter l'URL du logo si disponible
        if (settings.logo_path) {
          // Utiliser l'URL publique du logo pour les emails (meilleure compatibilité avec tous les clients email)
          // Certains clients email bloquent les images base64, donc on utilise une URL publique
          if (!data.company) {
            data.company = {};
          }
          
          const apiUrl = process.env.API_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
          // S'assurer que l'URL est absolue et accessible publiquement
          const logoUrl = apiUrl.startsWith('http') 
            ? `${apiUrl}/api/settings/logo/${userId}`
            : `https://${apiUrl}/api/settings/logo/${userId}`;
          
          data.company.logo_url = logoUrl;
          console.log(`✅ Logo URL configurée pour les emails: ${logoUrl}`);
        } else {
          console.log(`ℹ️ Aucun logo configuré pour l'utilisateur ${userId}`);
        }
      }
    }
    
    // Pour les alertes bugs automatiques, utiliser alert_email comme destinataire si configuré
    // Mais pour les envois manuels, respecter les destinataires spécifiés
    let actualRecipients = recipients;
    if (type === 'bugs' && alertEmail && useAlertEmailForBugs) {
      actualRecipients = [alertEmail];
      console.log(`📧 Alerte bug: envoi à ${alertEmail} au lieu des destinataires configurés`);
    } else {
      console.log(`📧 Envoi du rapport à ${actualRecipients.length} destinataire(s) spécifié(s): ${actualRecipients.join(', ')}`);
    }
    
    // Préparer l'expéditeur
    const fromEmail = supportEmail 
      ? `${data.company?.name || 'WeBoost'} <${supportEmail}>`
      : process.env.SMTP_FROM || 'WeBoost Software <noreply@weboost.com>';
    
    // Vérifier que le logo est bien défini avant de générer le rapport
    if (data.company && !data.company.logo_url) {
      console.warn(`⚠️ Logo non défini pour le rapport. Vérifiez les paramètres de l'utilisateur ${userId}`);
    } else if (data.company && data.company.logo_url) {
      const isBase64 = data.company.logo_url.startsWith('data:');
      console.log(`✅ Logo ${isBase64 ? 'en base64' : 'en URL'} défini pour le rapport: ${isBase64 ? data.company.logo_url.substring(0, 50) + '...' : data.company.logo_url}`);
    }
    
    // Générer le rapport HTML à partir du template
    const html = await generateReport(type, data);
    
    if (!html) {
      console.error(`❌ Échec de la génération du rapport pour le type: ${type}`);
      return false;
    }
    
    // Vérifier que le logo est bien inclus dans le HTML généré
    if (data.company && data.company.logo_url && !html.includes(data.company.logo_url.substring(0, 50))) {
      console.warn(`⚠️ Le logo ne semble pas être inclus dans le HTML généré`);
    } else if (data.company && data.company.logo_url) {
      console.log(`✅ Logo vérifié dans le HTML généré`);
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


