#!/bin/bash

# Script de diagnostic pour WeBoost
# Ce script vérifie tous les composants du serveur pour identifier les problèmes

echo "=========================================="
echo "🔍 DIAGNOSTIC DU SERVEUR WEB BOOST"
echo "=========================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les erreurs
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour afficher les succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher les avertissements
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Vérifier Nginx
echo "1️⃣  Vérification de Nginx..."
if systemctl is-active --quiet nginx; then
    success "Nginx est en cours d'exécution"
    echo "   Statut: $(systemctl is-active nginx)"
else
    error "Nginx n'est PAS en cours d'exécution"
    echo "   Essayez: systemctl start nginx"
fi

# Vérifier la configuration Nginx
echo ""
echo "   Vérification de la configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
    success "Configuration Nginx valide"
else
    error "Configuration Nginx invalide"
    echo "   Erreurs:"
    nginx -t 2>&1 | grep -i error
fi

# Vérifier si le site est activé
echo ""
if [ -f "/etc/nginx/sites-enabled/weboost" ]; then
    success "Le site weboost est activé"
else
    error "Le site weboost n'est PAS activé"
    echo "   Essayez: ln -s /etc/nginx/sites-available/weboost /etc/nginx/sites-enabled/"
fi

# 2. Vérifier PM2 et le backend
echo ""
echo "2️⃣  Vérification du Backend (PM2)..."
if command -v pm2 &> /dev/null; then
    success "PM2 est installé"
    
    # Vérifier si l'application est en cours d'exécution
    if pm2 list | grep -q "weboost-backend"; then
        STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="weboost-backend") | .pm2_env.status' 2>/dev/null || echo "unknown")
        if [ "$STATUS" = "online" ]; then
            success "Backend weboost-backend est en ligne"
        else
            error "Backend weboost-backend est $STATUS"
            echo "   Essayez: pm2 restart weboost-backend"
        fi
    else
        error "Backend weboost-backend n'est PAS dans PM2"
        echo "   Essayez: cd /var/www/weboost && pm2 start ecosystem.config.js"
    fi
    
    # Afficher les logs récents
    echo ""
    echo "   📋 Dernières erreurs du backend:"
    pm2 logs weboost-backend --lines 5 --nostream 2>/dev/null | tail -n 5 || echo "   (Impossible de récupérer les logs)"
else
    error "PM2 n'est PAS installé"
    echo "   Essayez: npm install -g pm2"
fi

# 3. Vérifier le fichier .env
echo ""
echo "3️⃣  Vérification du fichier .env..."
ENV_FILE="/var/www/weboost/backend/.env"
if [ -f "$ENV_FILE" ]; then
    success "Le fichier .env existe"
    
    # Vérifier les variables importantes
    if grep -q "DB_HOST=" "$ENV_FILE"; then
        DB_HOST=$(grep "DB_HOST=" "$ENV_FILE" | cut -d '=' -f2)
        echo "   DB_HOST: $DB_HOST"
    else
        warning "DB_HOST n'est pas défini dans .env"
    fi
    
    if grep -q "DB_NAME=" "$ENV_FILE"; then
        DB_NAME=$(grep "DB_NAME=" "$ENV_FILE" | cut -d '=' -f2)
        echo "   DB_NAME: $DB_NAME"
    else
        warning "DB_NAME n'est pas défini dans .env"
    fi
    
    if grep -q "JWT_SECRET=" "$ENV_FILE"; then
        JWT_SECRET=$(grep "JWT_SECRET=" "$ENV_FILE" | cut -d '=' -f2)
        if [ ${#JWT_SECRET} -lt 20 ]; then
            warning "JWT_SECRET semble trop court (doit être >= 20 caractères)"
        else
            success "JWT_SECRET est configuré"
        fi
    else
        error "JWT_SECRET n'est PAS défini dans .env"
    fi
else
    error "Le fichier .env n'existe PAS"
    echo "   Chemin attendu: $ENV_FILE"
fi

# 4. Vérifier PostgreSQL
echo ""
echo "4️⃣  Vérification de PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    success "PostgreSQL est en cours d'exécution"
else
    error "PostgreSQL n'est PAS en cours d'exécution"
    echo "   Essayez: systemctl start postgresql"
fi

# Tenter une connexion à la base de données
if [ -f "$ENV_FILE" ]; then
    DB_NAME=$(grep "DB_NAME=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    DB_USER=$(grep "DB_USER=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [ ! -z "$DB_NAME" ] && [ ! -z "$DB_USER" ]; then
        echo ""
        echo "   Test de connexion à la base de données..."
        if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
            success "La base de données '$DB_NAME' existe"
        else
            error "La base de données '$DB_NAME' n'existe PAS"
        fi
    fi
fi

# 5. Vérifier les fichiers frontend
echo ""
echo "5️⃣  Vérification du Frontend..."
FRONTEND_DIR="/var/www/weboost/frontend/dist"
if [ -d "$FRONTEND_DIR" ]; then
    success "Le répertoire frontend/dist existe"
    
    if [ -f "$FRONTEND_DIR/index.html" ]; then
        success "Le fichier index.html existe"
    else
        error "Le fichier index.html n'existe PAS"
        echo "   Rebuild nécessaire: cd /var/www/weboost/frontend && npm run build"
    fi
else
    error "Le répertoire frontend/dist n'existe PAS"
    echo "   Chemin attendu: $FRONTEND_DIR"
fi

# 6. Vérifier les ports
echo ""
echo "6️⃣  Vérification des ports..."
if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
    success "Le port 80 est ouvert (Nginx)"
else
    error "Le port 80 n'est PAS ouvert"
fi

if netstat -tlnp 2>/dev/null | grep -q ":5000 "; then
    success "Le port 5000 est ouvert (Backend)"
else
    warning "Le port 5000 n'est PAS ouvert (le backend peut ne pas être démarré)"
fi

# 7. Tester l'API backend
echo ""
echo "7️⃣  Test de l'API Backend..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health | grep -q "200"; then
    success "L'API backend répond correctement"
    echo "   Réponse: $(curl -s http://localhost:5000/api/health)"
else
    error "L'API backend ne répond PAS"
    echo "   Vérifiez: curl http://localhost:5000/api/health"
fi

# 8. Tester Nginx depuis localhost
echo ""
echo "8️⃣  Test de Nginx..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200\|301\|302"; then
    success "Nginx répond correctement sur localhost"
else
    error "Nginx ne répond PAS correctement"
    echo "   Code HTTP: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/)"
fi

# 9. Vérifier les permissions
echo ""
echo "9️⃣  Vérification des permissions..."
if [ -r "$FRONTEND_DIR" ]; then
    success "Permissions de lecture OK pour frontend/dist"
else
    error "Problème de permissions pour frontend/dist"
    echo "   Essayez: chmod -R 755 $FRONTEND_DIR"
fi

# 10. Résumé
echo ""
echo "=========================================="
echo "📊 RÉSUMÉ"
echo "=========================================="
echo ""

# Compter les problèmes
PROBLEMS=0

if ! systemctl is-active --quiet nginx; then
    PROBLEMS=$((PROBLEMS + 1))
fi

if ! command -v pm2 &> /dev/null || ! pm2 list | grep -q "weboost-backend.*online"; then
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ ! -f "$ENV_FILE" ]; then
    PROBLEMS=$((PROBLEMS + 1))
fi

if ! systemctl is-active --quiet postgresql; then
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ ! -f "$FRONTEND_DIR/index.html" ]; then
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ $PROBLEMS -eq 0 ]; then
    success "Aucun problème majeur détecté !"
    echo ""
    echo "🌐 Votre site devrait être accessible sur: http://51.15.254.112"
else
    error "$PROBLEMS problème(s) détecté(s)"
    echo ""
    echo "🔧 Actions recommandées:"
    echo ""
    
    if ! systemctl is-active --quiet nginx; then
        echo "   1. Démarrer Nginx: systemctl start nginx"
    fi
    
    if ! command -v pm2 &> /dev/null; then
        echo "   2. Installer PM2: npm install -g pm2"
    elif ! pm2 list | grep -q "weboost-backend.*online"; then
        echo "   2. Démarrer le backend: cd /var/www/weboost && pm2 start ecosystem.config.js"
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        echo "   3. Créer le fichier .env dans /var/www/weboost/backend/"
    fi
    
    if ! systemctl is-active --quiet postgresql; then
        echo "   4. Démarrer PostgreSQL: systemctl start postgresql"
    fi
    
    if [ ! -f "$FRONTEND_DIR/index.html" ]; then
        echo "   5. Rebuild le frontend: cd /var/www/weboost/frontend && npm run build"
    fi
fi

echo ""
echo "=========================================="
echo "🔍 Pour plus de détails:"
echo "   - Logs backend: pm2 logs weboost-backend"
echo "   - Logs Nginx: tail -f /var/log/nginx/error.log"
echo "   - Statut Nginx: systemctl status nginx"
echo "=========================================="



