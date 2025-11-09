import cron from 'node-cron';
import { pool } from '../database/connection';
import { sendReportEmail, ReportData } from '../utils/email';
import { generateReport } from '../utils/reportRenderer';

// Fonction pour obtenir la date/heure en heure française
function getFrenchTime(): Date {
  // Créer une date avec le fuseau horaire Europe/Paris
  const now = new Date();
  const frenchTimeString = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
  return new Date(frenchTimeString);
}

// Fonction pour préparer les données du rapport
async function prepareReportData(notification: any, project: any, customer: any): Promise<ReportData> {
  return {
    project: {
      domain: project.domain || '',
      url: project.url || '',
      health_score: project.health_score || 100,
      status: project.status || 'active',
      traffic_data: project.traffic_data || {},
      performance_data: project.performance_data || {},
      alerts: project.alerts || [],
      broken_links: project.broken_links || [],
    },
    customer: {
      name: customer.name || '',
      email: customer.email || '',
    },
    traffic: project.traffic_data?.visitors 
      ? {
          visitors: project.traffic_data.visitors,
          pageviews: project.traffic_data.pageviews || 0,
        }
      : undefined,
    performance: project.performance_data?.score
      ? {
          score: project.performance_data.score,
          loadTime: project.performance_data.loadTime || 0,
        }
      : undefined,
    alerts: Array.isArray(project.alerts) ? project.alerts : [],
  };
}

// Fonction pour envoyer les notifications
async function sendNotifications(type: string, frequency: string) {
  try {
    console.log(`📧 Vérification des notifications ${type} (${frequency})...`);

    // Récupérer toutes les notifications activées du type et fréquence spécifiés
    const notifications = await pool.query(
      `SELECT n.*, p.*, c.name as customer_name, c.email as customer_email, c.created_by as admin_user_id
       FROM notifications n
       LEFT JOIN projects p ON n.project_id = p.id
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE n.enabled = true 
       AND n.type = $1 
       AND n.frequency = $2`,
      [type, frequency]
    );

    if (notifications.rows.length === 0) {
      console.log(`   Aucune notification ${type} (${frequency}) à envoyer`);
      return;
    }

    console.log(`   ${notifications.rows.length} notification(s) à envoyer`);

    for (const notification of notifications.rows) {
      try {
        const recipients = Array.isArray(notification.recipients) 
          ? notification.recipients 
          : typeof notification.recipients === 'string' 
            ? JSON.parse(notification.recipients) 
            : [];

        if (recipients.length === 0) {
          console.log(`   ⚠️  Aucun destinataire pour le projet ${notification.domain}`);
          continue;
        }

        // Préparer les données du rapport
        const reportData = await prepareReportData(notification, notification, {
          name: notification.customer_name || '',
          email: notification.customer_email || '',
        });

        // Générer le sujet de l'email
        const subject = notification.type === 'bugs' 
          ? `🚨 Rapport de bugs - ${notification.domain}`
          : notification.type === 'weekly_report'
            ? `📊 Rapport hebdomadaire - ${notification.domain}`
            : `📈 Rapport mensuel - ${notification.domain}`;

        // Récupérer l'ID de l'utilisateur admin qui a créé le client (pour le logo et les settings)
        // Pour les alertes bugs, c'est l'admin qui doit recevoir l'alerte
        // Pour les rapports, c'est aussi l'admin dont on utilise les settings (logo, support_email)
        const userId = notification.admin_user_id || null;

        // Envoyer l'email
        const success = await sendReportEmail(
          notification.type,
          recipients,
          subject,
          reportData,
          userId
        );

        if (success) {
          console.log(`   ✅ Email envoyé pour ${notification.domain} à ${recipients.length} destinataire(s)`);
        } else {
          console.log(`   ❌ Erreur lors de l'envoi pour ${notification.domain}`);
        }
      } catch (error) {
        console.error(`   ❌ Erreur pour le projet ${notification.domain}:`, error);
      }
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi des notifications ${type} (${frequency}):`, error);
  }
}

// Planifier les tâches quotidiennes (08:00 heure française)
// Utilisation du fuseau horaire Europe/Paris pour que node-cron utilise l'heure française
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Exécution des tâches quotidiennes (08:00 heure française)');
  await sendNotifications('bugs', 'daily');
  await sendNotifications('weekly_report', 'daily');
  await sendNotifications('monthly_report', 'daily');
}, {
  timezone: 'Europe/Paris'
});

// Planifier les tâches hebdomadaires (dimanche 08:00 heure française)
cron.schedule('0 8 * * 0', async () => {
  console.log('⏰ Exécution des tâches hebdomadaires (dimanche 08:00 heure française)');
  await sendNotifications('bugs', 'weekly');
  await sendNotifications('weekly_report', 'weekly');
  await sendNotifications('monthly_report', 'weekly');
}, {
  timezone: 'Europe/Paris'
});

// Planifier les tâches mensuelles
// Vérifier chaque jour à 10:00 heure française si c'est le premier jour du mois
cron.schedule('0 10 * * *', async () => {
  const frenchTime = getFrenchTime();
  const day = frenchTime.getDate();
  const dayOfWeek = frenchTime.getDay();
  
  // Si c'est le premier jour du mois
  if (day === 1) {
    const isSat = dayOfWeek === 6; // 6 = samedi
    
    // Pour les alertes bugs : envoyer même si c'est samedi
    console.log('⏰ Exécution des tâches mensuelles (premier jour du mois 10:00 heure française)');
    await sendNotifications('bugs', 'monthly');
    
    // Pour les rapports : repousser si c'est samedi
    if (isSat) {
      console.log('   📅 C\'est un samedi, les rapports mensuels seront envoyés demain (dimanche)');
      // On ne fait rien, le cron du lendemain s'en chargera
    } else {
      await sendNotifications('weekly_report', 'monthly');
      await sendNotifications('monthly_report', 'monthly');
    }
  } else if (day === 2 && dayOfWeek === 0) {
    // Si c'est le 2 et que c'est dimanche, vérifier si hier était le 1er (samedi)
    // Dans ce cas, envoyer les rapports mensuels qui ont été repoussés
    const yesterday = new Date(frenchTime);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (yesterday.getDate() === 1 && yesterday.getDay() === 6) {
      console.log('⏰ Envoi des rapports mensuels repoussés (dimanche 10:00 heure française)');
      await sendNotifications('weekly_report', 'monthly');
      await sendNotifications('monthly_report', 'monthly');
    }
  }
}, {
  timezone: 'Europe/Paris'
});

console.log('✅ Planificateur de notifications initialisé');
console.log('   - Quotidien : 08:00 heure française');
console.log('   - Hebdomadaire : Dimanche 08:00 heure française');
console.log('   - Mensuel : Premier jour du mois 10:00 heure française');
console.log('   - Rapports mensuels repoussés si le 1er tombe un samedi');

