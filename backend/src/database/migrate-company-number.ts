import { pool } from './connection';

export async function migrateCompanyNumber() {
  try {
    // Vérifier si la colonne company_number existe déjà dans customers
    const checkCustomers = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='customers' AND column_name='company_number'
    `);
    
    if (checkCustomers.rows.length === 0) {
      await pool.query(`
        ALTER TABLE customers 
        ADD COLUMN company_number VARCHAR(100)
      `);
      console.log('✅ Colonne company_number ajoutée à customers');
    }

    // Vérifier si la colonne company_number existe déjà dans settings
    const checkSettings = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='settings' AND column_name='company_number'
    `);
    
    if (checkSettings.rows.length === 0) {
      await pool.query(`
        ALTER TABLE settings 
        ADD COLUMN company_number VARCHAR(100)
      `);
      console.log('✅ Colonne company_number ajoutée à settings');
    }

    console.log('✅ Migration company_number terminée');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  migrateCompanyNumber()
    .then(() => {
      console.log('Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur:', error);
      process.exit(1);
    });
}



