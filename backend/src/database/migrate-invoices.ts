import { pool } from './connection';

export async function migrateInvoices() {
  try {
    // Vérifier si la table existe déjà
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices'
      )
    `);

    if (!checkTable.rows[0].exists) {
      await pool.query(`
        CREATE TABLE invoices (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
          invoice_number VARCHAR(100) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'EUR',
          invoice_date DATE NOT NULL,
          due_date DATE,
          status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue', 'cancelled')),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Créer un index pour améliorer les performances
      await pool.query(`
        CREATE INDEX idx_invoices_customer_id ON invoices(customer_id)
      `);
      await pool.query(`
        CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date)
      `);
      await pool.query(`
        CREATE INDEX idx_invoices_status ON invoices(status)
      `);

      console.log('✅ Table invoices créée');
    }

    console.log('✅ Migration invoices terminée');
  } catch (error) {
    console.error('Erreur lors de la migration des factures:', error);
    throw error;
  }
}

