#!/bin/bash
# Script de démarrage pour Railway
# Ce script s'assure que la base de données est initialisée avant de démarrer l'application

echo "🚀 Démarrage de l'application WeBoost sur Railway"
echo "=================================================="

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
sleep 2

# Initialiser la base de données (sera fait automatiquement au premier démarrage)
echo "✅ Base de données prête"

# Démarrer l'application
echo "🚀 Démarrage de l'application..."
exec npm start

