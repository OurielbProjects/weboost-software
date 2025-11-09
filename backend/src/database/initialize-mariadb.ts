import { query } from './connection-mariadb';

export async function initializeDatabase() {
  try {
    // Créer les tables si elles n'existent pas
    // Note: MariaDB utilise AUTO_INCREMENT au lieu de SERIAL
    // et JSON au lieu de JSONB
    
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'client',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_role CHECK (role IN ('admin', 'client'))
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        company_number VARCHAR(100),
        website_url VARCHAR(500),
        contract_file_path VARCHAR(500),
        custom_fields JSON DEFAULT ('{}'),
        collaboration_start_date DATE,
        services JSON DEFAULT ('[]'),
        api_keys JSON DEFAULT ('[]'),
        user_id INT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        domain VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        traffic_data JSON DEFAULT ('{}'),
        broken_links JSON DEFAULT ('[]'),
        performance_data JSON DEFAULT ('{}'),
        alerts JSON DEFAULT ('[]'),
        server_status JSON DEFAULT ('{}'),
        health_score INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        type VARCHAR(50) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        frequency VARCHAR(50) DEFAULT 'weekly',
        recipients JSON DEFAULT ('[]'),
        settings JSON DEFAULT ('{}'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS report_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        html_template TEXT NOT NULL,
        css_styles TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE,
        logo_path VARCHAR(500),
        company_name VARCHAR(255),
        company_email VARCHAR(255),
        company_phone VARCHAR(50),
        company_address TEXT,
        company_number VARCHAR(100),
        support_email VARCHAR(255),
        alert_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS checklist_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMP NULL,
        priority VARCHAR(50) DEFAULT 'medium',
        deadline DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        user_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(50) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT chk_ticket_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        CONSTRAINT chk_ticket_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT,
        user_id INT,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        invoice_number VARCHAR(100) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'EUR',
        invoice_date DATE NOT NULL,
        due_date DATE NULL,
        status VARCHAR(50) DEFAULT 'unpaid',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        CONSTRAINT chk_invoice_status CHECK (status IN ('paid', 'unpaid', 'overdue', 'cancelled'))
      )
    `);

    // Créer les index pour améliorer les performances
    await query(`CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`);

    // Créer un utilisateur admin par défaut si aucun n'existe
    const adminCheck = await query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
    if (parseInt(adminCheck.rows[0]?.count || '0') === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await query(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        ['admin@weboost.com', hashedPassword, 'Administrateur', 'admin']
      );
      console.log('✅ Default admin user created: admin@weboost.com / admin123');
    }

    console.log('✅ Database tables created/verified');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

