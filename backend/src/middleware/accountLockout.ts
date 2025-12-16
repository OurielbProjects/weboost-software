import { pool } from '../database/connection';

interface FailedAttempt {
  email: string;
  attempts: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

// Stockage en mémoire des tentatives échouées (en production, utiliser Redis)
const failedAttempts = new Map<string, FailedAttempt>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function checkAccountLockout(email: string): Promise<{ locked: boolean; remainingTime?: number }> {
  const attempt = failedAttempts.get(email);

  if (!attempt) {
    return { locked: false };
  }

  // Vérifier si le compte est verrouillé
  if (attempt.lockedUntil && attempt.lockedUntil > new Date()) {
    const remainingTime = Math.ceil((attempt.lockedUntil.getTime() - Date.now()) / 1000 / 60);
    return { locked: true, remainingTime };
  }

  // Déverrouiller si la période est écoulée
  if (attempt.lockedUntil && attempt.lockedUntil <= new Date()) {
    failedAttempts.delete(email);
    return { locked: false };
  }

  return { locked: false };
}

export function recordFailedAttempt(email: string): void {
  const attempt = failedAttempts.get(email) || {
    email,
    attempts: 0,
    lastAttempt: new Date(),
  };

  attempt.attempts += 1;
  attempt.lastAttempt = new Date();

  if (attempt.attempts >= MAX_ATTEMPTS) {
    attempt.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
  }

  failedAttempts.set(email, attempt);
}

export function clearFailedAttempts(email: string): void {
  failedAttempts.delete(email);
}

export function resetAllLockouts(): void {
  failedAttempts.clear();
}

// Nettoyer les tentatives anciennes toutes les heures
setInterval(() => {
  const now = new Date();
  for (const [email, attempt] of failedAttempts.entries()) {
    if (attempt.lockedUntil && attempt.lockedUntil <= now) {
      failedAttempts.delete(email);
    }
  }
}, 60 * 60 * 1000);



