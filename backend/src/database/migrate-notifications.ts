import { pool } from './connection';

export async function migrateNotifications() {
  try {
    // Vérifier si la colonne project_id existe déjà
    const checkProjectId = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notifications' AND column_name='project_id'
    `);
    
    const checkUserId = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notifications' AND column_name='user_id'
    `);

    // Si user_id existe mais pas project_id, migrer
    if (checkUserId.rows.length > 0 && checkProjectId.rows.length === 0) {
      // Ajouter la colonne project_id
      await pool.query(`
        ALTER TABLE notifications 
        ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE
      `);
      console.log('✅ Colonne project_id ajoutée à notifications');
      
      // Supprimer l'ancienne colonne user_id (optionnel, on peut la garder pour compatibilité)
      // await pool.query(`ALTER TABLE notifications DROP COLUMN user_id`);
    }

    console.log('✅ Migration notifications terminée');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  migrateNotifications()
    .then(() => {
      console.log('Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur:', error);
      process.exit(1);
    });
}



