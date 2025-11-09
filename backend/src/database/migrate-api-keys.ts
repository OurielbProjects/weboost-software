import { pool } from './connection';

export async function migrateApiKeys() {
  try {
    // Vérifier si la colonne api_keys existe déjà
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='customers' AND column_name='api_keys'
    `);

    if (checkColumn.rows.length === 0) {
      // Ajouter la colonne api_keys
      await pool.query(`
        ALTER TABLE customers 
        ADD COLUMN api_keys JSONB DEFAULT '[]'
      `);
      console.log('✅ Colonne api_keys ajoutée à la table customers');
    } else {
      console.log('ℹ️  Colonne api_keys existe déjà');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la migration api_keys:', error);
    throw error;
  }
}



