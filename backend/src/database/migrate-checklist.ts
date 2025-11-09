import { pool } from './connection';

export async function migrateChecklist() {
  try {
    // Vérifier si les colonnes existent déjà
    const checkPriority = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='checklist_items' AND column_name='priority'
    `);
    
    const checkDeadline = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='checklist_items' AND column_name='deadline'
    `);

    // Ajouter la colonne priority si elle n'existe pas
    if (checkPriority.rows.length === 0) {
      await pool.query(`
        ALTER TABLE checklist_items 
        ADD COLUMN priority VARCHAR(50) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
      `);
      console.log('✅ Colonne priority ajoutée');
    }

    // Ajouter la colonne deadline si elle n'existe pas
    if (checkDeadline.rows.length === 0) {
      await pool.query(`
        ALTER TABLE checklist_items 
        ADD COLUMN deadline DATE
      `);
      console.log('✅ Colonne deadline ajoutée');
    }

    console.log('✅ Migration checklist terminée');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  migrateChecklist()
    .then(() => {
      console.log('Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur:', error);
      process.exit(1);
    });
}



