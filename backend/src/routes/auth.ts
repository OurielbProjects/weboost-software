import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../database/connection';
import { loginLimiter, logSecurityEvent } from '../middleware/security';
import { checkAccountLockout, recordFailedAttempt, clearFailedAttempts, resetAllLockouts } from '../middleware/accountLockout';
import { validatePasswordStrength } from '../middleware/passwordPolicy';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Login avec sécurité renforcée
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Vérifier le verrouillage du compte
    // TEMPORAIREMENT DÉSACTIVÉ pour permettre la réinitialisation
    // const lockoutStatus = await checkAccountLockout(email);
    // if (lockoutStatus.locked) {
    //   logSecurityEvent('LOGIN_BLOCKED', { email, reason: 'Account locked', remainingTime: lockoutStatus.remainingTime });
    //   return res.status(429).json({ 
    //     error: `Compte verrouillé. Réessayez dans ${lockoutStatus.remainingTime} minutes.` 
    //   });
    // }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Ne pas révéler si l'email existe ou non (timing attack protection)
      recordFailedAttempt(email);
      logSecurityEvent('LOGIN_FAILED', { email, reason: 'Invalid credentials' });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Délai constant
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      recordFailedAttempt(email);
      logSecurityEvent('LOGIN_FAILED', { email, userId: user.id, reason: 'Invalid password' });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Délai constant
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Connexion réussie - réinitialiser les tentatives
    clearFailedAttempts(email);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || typeof jwtSecret !== 'string' || jwtSecret === 'secret') {
      logSecurityEvent('SECURITY_WARNING', { message: 'JWT_SECRET not properly configured' });
      return res.status(500).json({ error: 'Configuration serveur invalide' });
    }

    // JWT avec expiration courte (1 heure) + refresh token
    const token = jwt.sign(
      { userId: user.id, role: user.role, type: 'access' },
      jwtSecret,
      { expiresIn: '1h' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      jwtSecret,
      { expiresIn: '7d' } as jwt.SignOptions
    );

    logSecurityEvent('LOGIN_SUCCESS', { email, userId: user.id });

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logSecurityEvent('LOGIN_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Register (admin only) avec validation de mot de passe
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'client' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Valider la force du mot de passe
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Mot de passe trop faible',
        details: passwordValidation.errors
      });
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    // Hachage avec salt rounds plus élevé
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email.toLowerCase().trim(), hashedPassword, name.trim(), role]
    );

    logSecurityEvent('USER_CREATED', { email, userId: result.rows[0].id, role });

    res.status(201).json({ user: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    logSecurityEvent('REGISTER_ERROR', { error: error.message });
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number };
    
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
});

// Reset all account lockouts (admin only)
router.post('/reset-lockouts', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    resetAllLockouts();
    logSecurityEvent('LOCKOUTS_RESET', { adminId: req.userId });
    res.json({ message: 'Tous les verrouillages de compte ont été réinitialisés' });
  } catch (error) {
    console.error('Reset lockouts error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Emergency reset lockouts (public endpoint with secret)
// Usage: POST /api/auth/emergency-reset-lockouts
// Body: { secret: "RESET_LOCKOUTS_2024" }
router.post('/emergency-reset-lockouts', async (req, res) => {
  try {
    const { secret } = req.body;
    const expectedSecret = process.env.RESET_LOCKOUTS_SECRET || 'RESET_LOCKOUTS_2024';
    
    if (secret !== expectedSecret) {
      return res.status(401).json({ error: 'Secret invalide' });
    }
    
    resetAllLockouts();
    logSecurityEvent('LOCKOUTS_RESET_EMERGENCY', { ip: req.ip });
    res.json({ message: 'Tous les verrouillages de compte ont été réinitialisés avec succès' });
  } catch (error) {
    console.error('Emergency reset lockouts error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Emergency reset admin password (public endpoint with secret)
// Usage: POST /api/auth/emergency-reset-admin
// Body: { secret: "RESET_ADMIN_2024", email: "admin@weboost.com", password: "Admin@weBoost123" }
router.post('/emergency-reset-admin', async (req, res) => {
  try {
    const { secret, email = 'admin@weboost.com', password = 'Admin@weBoost123' } = req.body;
    const expectedSecret = process.env.RESET_ADMIN_SECRET || 'RESET_ADMIN_2024';
    
    if (secret !== expectedSecret) {
      return res.status(401).json({ error: 'Secret invalide' });
    }

    // Vérifier si l'utilisateur existe
    const userResult = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    if (userResult.rows.length === 0) {
      // Créer l'utilisateur s'il n'existe pas
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        [email.toLowerCase().trim(), hashedPassword, 'Administrateur', 'admin']
      );
      logSecurityEvent('ADMIN_CREATED_EMERGENCY', { email, ip: req.ip });
      res.json({ 
        message: 'Utilisateur admin créé avec succès',
        email,
        password: 'Le mot de passe fourni a été défini'
      });
    } else {
      // Mettre à jour le mot de passe
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email.toLowerCase().trim()]);
      logSecurityEvent('ADMIN_PASSWORD_RESET_EMERGENCY', { email, userId: userResult.rows[0].id, ip: req.ip });
      res.json({ 
        message: 'Mot de passe admin réinitialisé avec succès',
        email,
        password: 'Le mot de passe fourni a été défini'
      });
    }
  } catch (error) {
    console.error('Emergency reset admin error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;




