import { Request, Response, NextFunction } from 'express';

// Rate limiting simple en mémoire
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

function getClientId(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function createRateLimiter(windowMs: number, max: number, message: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientId(req);
    const now = Date.now();
    const key = `${clientId}-${req.path}`;

    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    if (rateLimitStore[key].count >= max) {
      const retryAfter = Math.ceil((rateLimitStore[key].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: message });
    }

    rateLimitStore[key].count++;
    next();
  };
}

// Rate limiting pour les tentatives de connexion
export const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 tentatives max
  'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
);

// Rate limiting général pour l'API
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requêtes max
  'Trop de requêtes depuis cette IP. Veuillez réessayer plus tard.'
);

// Rate limiting strict pour les routes sensibles
export const strictLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 heure
  10, // 10 requêtes max
  'Trop de requêtes. Veuillez réessayer dans 1 heure.'
);

// Nettoyer le store toutes les heures
setInterval(() => {
  const now = Date.now();
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  }
}, 60 * 60 * 1000);

// Headers de sécurité
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content-Security-Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self';"
  );
  
  next();
};

// Middleware pour valider les entrées
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Protection contre les injections SQL basiques
  const sqlInjectionPattern = /(\%27)|(\')|(\-\-)|(\%23)|(#)/i;
  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return !sqlInjectionPattern.test(value) && !xssPattern.test(value);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).every(checkValue);
    }
    return true;
  };

  if (!checkValue(req.body) || !checkValue(req.query) || !checkValue(req.params)) {
    return res.status(400).json({ error: 'Entrée invalide détectée' });
  }

  next();
};

// Middleware pour logger les tentatives de connexion échouées
export const logSecurityEvent = (event: string, details: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event}:`, {
    ...details,
    timestamp,
  });
};

