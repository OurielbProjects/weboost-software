import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Charger le fichier .env depuis le répertoire backend
dotenv.config({ path: path.join(__dirname, '../.env') });

import { pool } from './database/connection';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import customerRoutes from './routes/customers';
import notificationRoutes from './routes/notifications';
import checklistRoutes from './routes/checklist';
import ticketRoutes from './routes/tickets';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import invoiceRoutes from './routes/invoices';
import { initializeDatabase } from './database/initialize';
import { migrateChecklist } from './database/migrate-checklist';
import { migrateNotifications } from './database/migrate-notifications';
import { migrateCompanyNumber } from './database/migrate-company-number';
import { migrateApiKeys } from './database/migrate-api-keys';
import { migrateEmailSettings } from './database/migrate-email-settings';
import { migrateInvoices } from './database/migrate-invoices';
import { securityHeaders, apiLimiter, validateInput } from './middleware/security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Vérifier que JWT_SECRET est configuré et sécurisé
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secret') {
  console.error('❌ ERREUR CRITIQUE: JWT_SECRET doit être configuré avec une valeur sécurisée dans .env');
  console.error('Générez un secret avec: openssl rand -base64 32');
  process.exit(1);
}

// Middleware de sécurité - DOIT être en premier
app.use(securityHeaders);
app.use(apiLimiter);
app.use(validateInput);

// CORS avec configuration sécurisée
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://software.weboost-il.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Limiter la taille des requêtes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (logos, contrats)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/invoices', invoiceRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Initialize database on startup
initializeDatabase()
  .then(() => migrateChecklist())
  .then(() => migrateNotifications())
  .then(() => migrateCompanyNumber())
  .then(() => migrateApiKeys())
  .then(() => migrateEmailSettings())
  .then(() => migrateInvoices())
  .then(() => {
    console.log('✅ Database initialized');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
    
    // Initialiser le planificateur de notifications
    import('./services/scheduler');
  })
  .catch((error) => {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  });


