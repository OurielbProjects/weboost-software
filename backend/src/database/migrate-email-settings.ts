import { pool } from './connection';

export async function migrateEmailSettings() {
  try {
    // Vérifier si les colonnes existent déjà
    const checkColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='settings' 
      AND column_name IN ('support_email', 'alert_email')
    `);

    const existingColumns = checkColumns.rows.map(row => row.column_name);

    // Ajouter support_email si elle n'existe pas
    if (!existingColumns.includes('support_email')) {
      await pool.query(`
        ALTER TABLE settings
        ADD COLUMN support_email VARCHAR(255)
      `);
      console.log('✅ Colonne support_email ajoutée à settings');
    }

    // Ajouter alert_email si elle n'existe pas
    if (!existingColumns.includes('alert_email')) {
      await pool.query(`
        ALTER TABLE settings
        ADD COLUMN alert_email VARCHAR(255)
      `);
      console.log('✅ Colonne alert_email ajoutée à settings');
    }

    console.log('✅ Migration email settings terminée');
  } catch (error) {
    console.error('Erreur lors de la migration des paramètres email:', error);
    throw error;
  }
}

