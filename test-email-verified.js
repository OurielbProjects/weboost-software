require('dotenv').config({ path: '/var/www/weboost/backend/.env' });
const axios = require('axios');

async function testSendGridEmail() {
  try {
    console.log('🧪 Test avec l\'adresse email vérifiée...');
    
    const fromEmail = 'support@weboost-il.com';
    
    console.log(`📧 Envoi d'email de test depuis ${fromEmail}...`);
    
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email: 'weboost52@gmail.com' }],
            subject: '✅ Test Email WeBoost - SendGrid Configuré',
          },
        ],
        from: {
          email: fromEmail,
          name: 'WeBoost Software',
        },
        content: [
          {
            type: 'text/plain',
            value: 'Test: SendGrid est correctement configuré avec support@weboost-il.com ! ✅\n\nLes emails peuvent maintenant être envoyés depuis l\'application WeBoost.',
          },
          {
            type: 'text/html',
            value: '<html><body style="font-family: Arial, sans-serif; padding: 20px;"><h1 style="color: #06b6d4;">✅ Test Email WeBoost</h1><p>SendGrid est correctement configuré avec <strong>support@weboost-il.com</strong> ! ✅</p><p>Les emails peuvent maintenant être envoyés depuis l\'application WeBoost.</p><p style="color: #666; font-size: 12px; margin-top: 30px;">Ceci est un email de test automatique.</p></body></html>',
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    if (response.status === 202) {
      console.log('✅ Email envoyé avec succès via SendGrid !');
      console.log(`   Status: ${response.status}`);
      console.log('   Destinataire: weboost52@gmail.com');
      console.log(`   Expéditeur: WeBoost Software <${fromEmail}>`);
      console.log('\n🎉 SendGrid est maintenant correctement configuré !');
      console.log('✅ Les emails peuvent être envoyés depuis l\'application.');
      return true;
    } else {
      console.error('❌ Erreur: Status', response.status);
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ Erreur SendGrid:');
      console.error(`   Status: ${error.response.status}`);
      console.error('   Message:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Erreur:', error.message);
    }
    return false;
  }
}

testSendGridEmail().then(success => {
  process.exit(success ? 0 : 1);
});



