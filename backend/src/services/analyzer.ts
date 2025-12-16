import axios from 'axios';
import { pool } from '../database/connection';

// Configuration PageSpeed Insights API
const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY || '';
const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

// Fonction pour analyser un site avec PageSpeed Insights
export async function analyzeSitePerformance(url: string, apiKey?: string): Promise<any> {
  try {
    const keyToUse = apiKey || PAGESPEED_API_KEY;
    if (!keyToUse) {
      console.warn('⚠️ PageSpeed API key not configured');
      return null;
    }

    const response = await axios.get(PAGESPEED_API_URL, {
      params: {
        url: url,
        key: keyToUse,
        strategy: 'mobile', // ou 'desktop'
        // L'API PageSpeed accepte plusieurs catégories séparées par des virgules
        category: 'performance,accessibility,best-practices,seo',
      },
      timeout: 30000, // 30 secondes
    });

    const data = response.data;
    const lighthouseResult = data.lighthouseResult;
    const categories = lighthouseResult.categories;

    // Calculer la note globale sur 100
    const performanceScore = Math.round((categories.performance?.score || 0) * 100);
    const accessibilityScore = Math.round((categories.accessibility?.score || 0) * 100);
    const bestPracticesScore = Math.round((categories['best-practices']?.score || 0) * 100);
    const seoScore = Math.round((categories.seo?.score || 0) * 100);

    // Note globale (moyenne pondérée)
    const overallScore = Math.round(
      (performanceScore * 0.4) +
      (accessibilityScore * 0.2) +
      (bestPracticesScore * 0.2) +
      (seoScore * 0.2)
    );

    // Métriques de performance
    const metrics = lighthouseResult.audits;
    const loadTime = metrics['first-contentful-paint']?.numericValue || 0;
    const timeToInteractive = metrics['interactive']?.numericValue || 0;
    const totalBlockingTime = metrics['total-blocking-time']?.numericValue || 0;

    // Taille de la page
    const pageSize = metrics['total-byte-weight']?.numericValue || 0;

    return {
      score: overallScore,
      performance: performanceScore,
      accessibility: accessibilityScore,
      bestPractices: bestPracticesScore,
      seo: seoScore,
      loadTime: Math.round(loadTime / 1000), // en secondes
      timeToInteractive: Math.round(timeToInteractive / 1000),
      totalBlockingTime: Math.round(totalBlockingTime),
      pageSize: Math.round(pageSize / 1024), // en KB
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error analyzing site performance:', error.message);
    return null;
  }
}

// Fonction pour vérifier si un lien est un endpoint WordPress à ignorer (exportée pour utilisation ailleurs)
export function isWordPressEndpoint(linkUrl: string): boolean {
  try {
    const url = new URL(linkUrl);
    const pathname = url.pathname;
    const fullPath = url.pathname + url.search; // Inclure les paramètres de requête
    
    // Patterns WordPress à ignorer (endpoints système du CMS)
    // Ces endpoints font partie du système WordPress et ne doivent pas être considérés comme des liens cassés
    const wordpressPatterns = [
      /\/xmlrpc\.php/i,                    // xmlrpc.php avec ou sans paramètres (API XML-RPC)
      /\/wp-json/i,                        // API REST WordPress
      /\/wp-login\.php/i,                  // Page de connexion WordPress
      /\/wp-admin/i,                       // Administration WordPress
    ];
    
    // Vérifier sur le pathname et le chemin complet avec paramètres
    return wordpressPatterns.some(pattern => pattern.test(pathname) || pattern.test(fullPath));
  } catch (error) {
    // Si l'URL est invalide, vérifier quand même sur la chaîne brute
    const wordpressPatterns = [
      /\/xmlrpc\.php/i,
      /\/wp-json/i,
      /\/wp-login\.php/i,
      /\/wp-admin/i,
    ];
    return wordpressPatterns.some(pattern => pattern.test(linkUrl));
  }
}

// Fonction pour vérifier si un lien est mal formé et doit être ignoré (exportée pour utilisation ailleurs)
export function isMalformedLink(linkUrl: string, baseUrl: string): boolean {
  try {
    // Vérifier les liens avec double slash dans le pathname (ex: //fonts.googleapis.com)
    // Cela crée des liens mal formés comme https://weboost-il.com//fonts.googleapis.com
    if (linkUrl.match(/https?:\/\/[^\/]+\/\/[^\/]/)) {
      return true;
    }
    
    // Vérifier les liens qui contiennent des domaines externes mal construits dans le pathname
    // Exemple: https://weboost-il.com//fonts.googleapis.com
    const url = new URL(linkUrl);
    const baseUrlObj = new URL(baseUrl);
    
    // Si le pathname commence par // suivi d'un nom de domaine (contient des points)
    // C'est probablement un lien externe mal formé
    if (url.pathname.match(/^\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
      return true;
    }
    
    // Vérifier les liens avec des caractères suspects dans le pathname
    if (url.pathname.includes('//')) {
      return true;
    }
    
    // Si le hostname est différent du hostname de base, c'est un lien externe
    // On les ignore pour l'instant (on ne vérifie que les liens internes)
    if (url.hostname !== baseUrlObj.hostname) {
      return true;
    }
    
    return false;
  } catch (error) {
    // Si l'URL est invalide, c'est probablement un lien mal formé
    return true;
  }
}

// Fonction pour vérifier les liens cassés d'un site
export async function checkBrokenLinks(url: string): Promise<any[]> {
  try {
    const brokenLinks: any[] = [];
    
    // Récupérer le contenu HTML de la page
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const html = response.data;
    
    // Extraire tous les liens (href)
    const linkRegex = /href=["']([^"']+)["']/gi;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      let link = match[1];
      
      // Ignorer les liens avec protocoles spéciaux (ne doivent pas être vérifiés)
      const specialProtocols = ['tel:', 'mailto:', 'sms:', 'whatsapp:', 'skype:', 'viber:', 'javascript:'];
      if (specialProtocols.some(protocol => link.toLowerCase().startsWith(protocol))) {
        continue;
      }
      
      // Ignorer les ancres (liens vers des sections de la même page)
      if (link.startsWith('#')) {
        continue;
      }
      
      // Convertir les liens relatifs en absolus
      if (link.startsWith('/')) {
        const urlObj = new URL(url);
        link = `${urlObj.protocol}//${urlObj.host}${link}`;
      } else if (!link.startsWith('http')) {
        const urlObj = new URL(url);
        link = `${urlObj.protocol}//${urlObj.host}/${link}`;
      }

      // Ignorer les liens externes pour l'instant (optionnel)
      if (link.startsWith(url) || link.startsWith(new URL(url).origin)) {
        links.push(link);
      }
    }

    // Vérifier chaque lien
    for (const link of links.slice(0, 50)) { // Limiter à 50 liens pour éviter les timeouts
      // Ignorer les endpoints WordPress (système CMS)
      if (isWordPressEndpoint(link)) {
        continue;
      }
      
      // Ignorer les liens mal formés
      if (isMalformedLink(link, url)) {
        continue;
      }
      
      try {
        const linkResponse = await axios.head(link, {
          timeout: 5000,
          validateStatus: (status) => status < 500, // Accepter les codes < 500
        });

        // Ignorer les codes 403 pour les endpoints WordPress (même si le pattern n'a pas matché)
        if (linkResponse.status === 403 && isWordPressEndpoint(link)) {
          continue;
        }

        if (linkResponse.status >= 400) {
          brokenLinks.push({
            url: link,
            status: linkResponse.status,
            error: `HTTP ${linkResponse.status}`,
            checkedAt: new Date().toISOString(),
          });
        }
      } catch (error: any) {
        // Ignorer les erreurs pour les endpoints WordPress
        if (isWordPressEndpoint(link)) {
          continue;
        }
        
        brokenLinks.push({
          url: link,
          status: 0,
          error: error.message || 'Erreur de connexion',
          checkedAt: new Date().toISOString(),
        });
      }
    }

    return brokenLinks;
  } catch (error: any) {
    console.error('Error checking broken links:', error.message);
    return [];
  }
}

// Fonction pour vérifier si un lien utilise un protocole spécial à ignorer
function isSpecialProtocolLink(linkUrl: string): boolean {
  const specialProtocols = ['tel:', 'mailto:', 'sms:', 'whatsapp:', 'skype:', 'viber:', 'javascript:'];
  const lowerLink = linkUrl.toLowerCase();
  
  // Vérifier les protocoles spéciaux
  if (specialProtocols.some(protocol => lowerLink.startsWith(protocol))) {
    return true;
  }
  
  // Ignorer les ancres
  if (linkUrl.startsWith('#')) {
    return true;
  }
  
  return false;
}

// Fonction utilitaire pour filtrer les liens cassés existants (pour nettoyer la base de données)
export function filterBrokenLinks(brokenLinks: any[], baseUrl: string): any[] {
  if (!Array.isArray(brokenLinks)) {
    return [];
  }
  
  return brokenLinks.filter((link) => {
    const linkUrl = typeof link === 'string' ? link : link.url;
    if (!linkUrl) {
      return false;
    }
    
    // Ignorer les protocoles spéciaux (tel:, mailto:, etc.)
    if (isSpecialProtocolLink(linkUrl)) {
      return false;
    }
    
    // Ignorer les endpoints WordPress
    if (isWordPressEndpoint(linkUrl)) {
      return false;
    }
    
    // Ignorer les liens mal formés
    if (isMalformedLink(linkUrl, baseUrl)) {
      return false;
    }
    
    return true;
  });
}

// Fonction pour vérifier le statut du serveur
export async function checkServerStatus(url: string): Promise<any> {
  try {
    const startTime = Date.now();
    
    const response = await axios.head(url, {
      timeout: 10000,
      validateStatus: () => true, // Accepter tous les codes de statut
    });

    const responseTime = Date.now() - startTime;
    const isActive = response.status >= 200 && response.status < 400;

    return {
      status: isActive ? 'active' : 'inactive',
      responseTime: responseTime,
      httpStatus: response.status,
      checkedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      status: 'inactive',
      responseTime: 0,
      httpStatus: 0,
      error: error.message || 'Erreur de connexion',
      checkedAt: new Date().toISOString(),
    };
  }
}

// Fonction pour mettre à jour les données d'un projet
export async function updateProjectData(projectId: number) {
  try {
    // Récupérer le projet avec les clés API du client
    const projectResult = await pool.query(
      `SELECT p.*, c.api_keys as customer_api_keys
       FROM projects p
       LEFT JOIN customers c ON p.customer_id = c.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new Error('Projet non trouvé');
    }

    const project = projectResult.rows[0];
    const url = project.url;

    // Récupérer la clé PageSpeed du client si disponible
    let pagespeedKey: string | undefined;
    if (project.customer_api_keys) {
      const apiKeys = typeof project.customer_api_keys === 'string' 
        ? JSON.parse(project.customer_api_keys) 
        : project.customer_api_keys;
      
      if (Array.isArray(apiKeys)) {
        const pagespeedKeyObj = apiKeys.find((k: any) => k.type === 'pagespeed');
        if (pagespeedKeyObj && pagespeedKeyObj.key) {
          pagespeedKey = pagespeedKeyObj.key;
        }
      }
    }

    console.log(`🔍 Analyse du projet ${project.domain} (${url})...`);

    // Analyser les performances avec la clé du client ou la clé globale
    const performanceData = await analyzeSitePerformance(url, pagespeedKey);
    
    // Vérifier les liens cassés
    const brokenLinks = await checkBrokenLinks(url);
    
    // Vérifier le statut du serveur
    const serverStatus = await checkServerStatus(url);

    // Calculer le score de santé
    let healthScore = 100;
    
    if (performanceData) {
      healthScore = performanceData.score;
    }
    
    // Réduire le score si des liens sont cassés
    if (brokenLinks.length > 0) {
      healthScore = Math.max(0, healthScore - (brokenLinks.length * 2));
    }
    
    // Réduire le score si le serveur est inactif
    if (serverStatus.status !== 'active') {
      healthScore = Math.max(0, healthScore - 20);
    }

    // Générer les alertes
    const alerts: any[] = [];
    
    if (brokenLinks.length > 0) {
      alerts.push({
        type: 'broken_links',
        message: `${brokenLinks.length} lien(s) cassé(s) détecté(s)`,
        severity: 'high',
        count: brokenLinks.length,
        createdAt: new Date().toISOString(),
      });
    }
    
    if (serverStatus.status !== 'active') {
      alerts.push({
        type: 'server_down',
        message: 'Serveur inaccessible',
        severity: 'critical',
        createdAt: new Date().toISOString(),
      });
    }
    
    if (performanceData && performanceData.performance < 50) {
      alerts.push({
        type: 'low_performance',
        message: `Performance faible (${performanceData.performance}/100)`,
        severity: 'medium',
        createdAt: new Date().toISOString(),
      });
    }

    // Mettre à jour le projet dans la base de données
    await pool.query(
      `UPDATE projects SET
        health_score = $1,
        performance_data = $2,
        broken_links = $3,
        server_status = $4,
        alerts = $5,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $6`,
      [
        healthScore,
        JSON.stringify(performanceData || {}),
        JSON.stringify(brokenLinks),
        JSON.stringify(serverStatus),
        JSON.stringify(alerts),
        projectId,
      ]
    );

    console.log(`✅ Projet ${project.domain} analysé - Score: ${healthScore}/100`);

    return {
      healthScore,
      performanceData,
      brokenLinks,
      serverStatus,
      alerts,
    };
  } catch (error: any) {
    console.error(`❌ Erreur lors de l'analyse du projet ${projectId}:`, error.message);
    throw error;
  }
}

