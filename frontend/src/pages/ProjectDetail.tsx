import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/api';
import { ArrowLeft, ExternalLink, TrendingUp, AlertTriangle, Activity, Server, Link as LinkIcon, Gauge, Bell, Mail, Save } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Project {
  id: number;
  domain: string;
  url: string;
  status: string;
  customer_id?: number;
  customer_name?: string;
  traffic_data?: any;
  broken_links?: any[];
  performance_data?: any;
  alerts?: any[];
  server_status?: any;
  health_score?: number;
}

interface Notification {
  id?: number;
  type: string;
  enabled: boolean;
  frequency: string;
  recipients: string[];
  settings?: any;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [saving, setSaving] = useState(false);
  const [trafficFilter, setTrafficFilter] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');

  const fetchProject = async () => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      const projectData = response.data.project;
      setProject(projectData);
      
      // Vérifier si une analyse est en cours
      if (!projectData.performance_data || Object.keys(projectData.performance_data).length === 0) {
        setAnalyzing(true);
      } else {
        setAnalyzing(false);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      // Lancer l'analyse en arrière-plan
      await axios.post(`/api/projects/${id}/analyze`);
      // Attendre un peu puis rafraîchir les données périodiquement
      let attempts = 0;
      const maxAttempts = 30; // 30 tentatives = 90 secondes max (PageSpeed peut prendre du temps)
      
      const checkInterval = setInterval(async () => {
        attempts++;
        const response = await axios.get(`/api/projects/${id}`);
        const projectData = response.data.project;
        setProject(projectData);
        
        // Vérifier si les données sont maintenant disponibles
        if (projectData && projectData.performance_data && Object.keys(projectData.performance_data).length > 0) {
          clearInterval(checkInterval);
          setAnalyzing(false);
          console.log('✅ Données d\'analyse disponibles');
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setAnalyzing(false);
          console.warn('⚠️ Analyse terminée mais données non disponibles après 90 secondes');
        }
      }, 3000);
      
      // Arrêter après 90 secondes maximum
      setTimeout(() => {
        clearInterval(checkInterval);
        setAnalyzing(false);
      }, 90000);
    } catch (error) {
      console.error('Error triggering analysis:', error);
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchNotifications();
      // Lancer l'analyse automatiquement
      triggerAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`/api/notifications/project/${id}`);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const updateNotification = async (notification: Notification) => {
    setSaving(true);
    try {
      await axios.post(`/api/notifications/project/${id}`, notification);
      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Projet non trouvé</p>
        <button onClick={() => navigate('/projects')} className="btn btn-primary mt-4">
          Retour aux projets
        </button>
      </div>
    );
  }

  // Préparer les données pour les graphiques
  const trafficData = project.traffic_data?.history || [];
  const performanceData = project.performance_data?.history || [];

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft size={20} />
          Retour aux projets
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{project.domain}</h1>
            {project.customer_name && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">Client: {project.customer_name}</p>
            )}
          </div>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary flex items-center gap-2"
          >
            <ExternalLink size={18} />
            Visiter le site
          </a>
        </div>
      </div>

      {/* Score de santé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`card ${analyzing ? 'animate-pulse' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Score de santé</p>
              {analyzing ? (
                <p className="text-lg font-semibold mt-2 text-primary-600 dark:text-primary-400 animate-pulse">
                  Vérification...
                </p>
              ) : (
                <p className={`text-3xl font-bold mt-2 ${
                  (project.health_score || 100) >= 80 ? 'text-green-600 dark:text-green-400' :
                  (project.health_score || 100) >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {project.health_score || 100}%
                </p>
              )}
            </div>
            <Gauge size={40} className={`text-primary-600 dark:text-primary-400 ${analyzing ? 'animate-spin' : ''}`} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Statut</p>
              <p className={`text-lg font-semibold mt-2 ${
                project.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {project.status === 'active' ? 'Actif' : 'Inactif'}
              </p>
            </div>
            <Activity size={40} className="text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <div className={`card ${analyzing ? 'animate-pulse' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Liens cassés</p>
              {analyzing ? (
                <p className="text-lg font-semibold mt-2 text-primary-600 dark:text-primary-400 animate-pulse">
                  Vérification...
                </p>
              ) : (
                <p className={`text-3xl font-bold mt-2 ${
                  (project.broken_links?.length || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {project.broken_links?.length || 0}
                </p>
              )}
            </div>
            <LinkIcon size={40} className={`text-primary-600 dark:text-primary-400 ${analyzing ? 'animate-pulse' : ''}`} />
          </div>
        </div>

        <div className="card relative group cursor-pointer" title={project.alerts && project.alerts.length > 0 ? `${project.alerts.length} alerte(s)` : 'Aucune alerte'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Alertes</p>
              <p className={`text-3xl font-bold mt-2 ${
                (project.alerts?.length || 0) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {project.alerts?.length || 0}
              </p>
            </div>
            <AlertTriangle size={40} className="text-primary-600 dark:text-primary-400" />
          </div>
          {project.alerts && project.alerts.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Détails des alertes :</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {project.alerts.map((alert: any, index: number) => (
                  <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-medium">{alert.type || 'Alerte'}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{alert.message || alert}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trafic web */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-primary-600 dark:text-primary-400" size={24} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trafic web</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTrafficFilter('today')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                trafficFilter === 'today' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setTrafficFilter('yesterday')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                trafficFilter === 'yesterday' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Hier
            </button>
            <button
              onClick={() => setTrafficFilter('week')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                trafficFilter === 'week' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Cette semaine
            </button>
            <button
              onClick={() => setTrafficFilter('month')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                trafficFilter === 'month' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Ce mois
            </button>
          </div>
        </div>
        {analyzing ? (
          <div className="text-center py-12 text-primary-600 dark:text-primary-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full mb-4"></div>
            <p className="animate-pulse">Vérification du trafic...</p>
          </div>
        ) : trafficData && trafficData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="visitors" stroke="#0ea5e9" name="Visiteurs" />
              <Line type="monotone" dataKey="pageviews" stroke="#8b5cf6" name="Pages vues" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="space-y-6">
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-semibold mb-2">Aucune donnée de trafic disponible</p>
              <p className="text-sm">Les données de trafic nécessitent une intégration avec Google Analytics</p>
            </div>
            
            {/* Statistiques de base basées sur le serveur */}
            {project.server_status && project.server_status.status === 'active' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Statut du site</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">En ligne</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Temps de réponse</p>
                  <p className="text-lg font-bold">
                    {project.server_status.responseTime || 'N/A'}ms
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dernière vérification</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {project.server_status.checkedAt 
                      ? new Date(project.server_status.checkedAt).toLocaleString('fr-FR')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Performances */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Gauge className="text-primary-600 dark:text-primary-400" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Performances</h2>
        </div>
        {analyzing ? (
          <div className="text-center py-12 text-primary-600 dark:text-primary-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full mb-4"></div>
            <p className="animate-pulse">Vérification des performances...</p>
          </div>
        ) : project.performance_data && Object.keys(project.performance_data).length > 0 ? (
          <div className="space-y-6">
            {/* Curseur de performance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Score de performance</p>
                <p className={`text-lg font-bold ${
                  (project.performance_data.performance || project.performance_data.score || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                  (project.performance_data.performance || project.performance_data.score || 0) >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {project.performance_data.performance || project.performance_data.score || 0}/100
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    (project.performance_data.performance || project.performance_data.score || 0) >= 80 ? 'bg-green-600' :
                    (project.performance_data.performance || project.performance_data.score || 0) >= 50 ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, project.performance_data.performance || project.performance_data.score || 0))}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Temps de chargement</p>
                <p className="text-2xl font-bold">
                  {project.performance_data.loadTime ? `${project.performance_data.loadTime}s` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Score PageSpeed</p>
                <p className={`text-2xl font-bold ${
                  (project.performance_data.performance || project.performance_data.score || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                  (project.performance_data.performance || project.performance_data.score || 0) >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {project.performance_data.performance || project.performance_data.score || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Taille de la page</p>
                <p className="text-2xl font-bold">
                  {project.performance_data.pageSize ? `${project.performance_data.pageSize} KB` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Accessibilité</p>
                <p className={`text-2xl font-bold ${
                  (project.performance_data.accessibility || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                  (project.performance_data.accessibility || 0) >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {project.performance_data.accessibility || 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Détails supplémentaires */}
            {(project.performance_data.seo || project.performance_data.bestPractices || project.performance_data.timeToInteractive) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {project.performance_data.seo && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">SEO</p>
                    <p className={`text-xl font-bold ${
                      (project.performance_data.seo || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                      (project.performance_data.seo || 0) >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {project.performance_data.seo}/100
                    </p>
                  </div>
                )}
                {project.performance_data.bestPractices && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Bonnes pratiques</p>
                    <p className={`text-xl font-bold ${
                      (project.performance_data.bestPractices || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                      (project.performance_data.bestPractices || 0) >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {project.performance_data.bestPractices}/100
                    </p>
                  </div>
                )}
                {project.performance_data.timeToInteractive && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Temps d'interactivité</p>
                    <p className="text-xl font-bold">
                      {project.performance_data.timeToInteractive}s
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            <p>Aucune donnée de performance disponible</p>
            <p className="text-sm mt-2">Les données de performance seront collectées automatiquement lors de l'analyse</p>
          </div>
        )}
      </div>

      {/* Liens cassés */}
      {project.broken_links && project.broken_links.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-6">
            <LinkIcon className="text-red-600 dark:text-red-400" size={24} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Liens cassés</h2>
          </div>
          <div className="space-y-2">
            {project.broken_links.map((link: any, index: number) => (
              <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm font-medium text-red-900 dark:text-red-300">{link.url || link}</p>
                {link.status && <p className="text-xs text-red-700 dark:text-red-400 mt-1">Status: {link.status}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertes */}
      {project.alerts && project.alerts.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={24} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Alertes</h2>
          </div>
          <div className="space-y-2">
            {project.alerts.map((alert: any, index: number) => (
              <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                  {alert.type || 'Alerte'}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  {alert.message || alert}
                </p>
                {alert.date && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                    {new Date(alert.date).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statut serveur */}
      <div className={`card mb-8 ${analyzing ? 'animate-pulse' : ''}`}>
        <div className="flex items-center gap-3 mb-6">
          <Server className="text-primary-600 dark:text-primary-400" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Statut serveur</h2>
        </div>
        {analyzing ? (
          <div className="text-center py-8 text-primary-600 dark:text-primary-400">
            <div className="animate-spin inline-block w-6 h-6 border-4 border-current border-t-transparent rounded-full mb-2"></div>
            <p className="animate-pulse text-sm">Vérification du serveur...</p>
          </div>
        ) : project.server_status && Object.keys(project.server_status).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Statut</p>
              <p className={`text-lg font-semibold ${
                project.server_status.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {project.server_status.status === 'active' ? 'Actif' : 'Inactif'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Temps de réponse</p>
              <p className="text-lg font-semibold">
                {project.server_status.responseTime || 'N/A'}ms
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <p>Aucune donnée de serveur disponible</p>
            <p className="text-sm mt-2">Les données seront collectées automatiquement</p>
          </div>
        )}
      </div>

      {/* Configuration des notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="text-primary-600 dark:text-primary-400" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Configurez les alertes et rapports pour ce projet
        </p>

        <div className="space-y-6">
          {[
            { type: 'bugs', label: 'Alertes de bugs', description: 'Recevez des notifications en cas de bugs détectés' },
            { type: 'weekly_report', label: 'Rapport hebdomadaire', description: 'Rapport hebdomadaire de performance' },
            { type: 'monthly_report', label: 'Rapport mensuel', description: 'Rapport mensuel de synthèse' },
          ].map((notifType) => {
            const existing = notifications.find((n) => n.type === notifType.type);
            const notification: Notification = existing || {
              type: notifType.type,
              enabled: false,
              frequency: 'weekly',
              recipients: [],
            };

            return (
              <div key={notifType.type} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {notifType.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notifType.description}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notification.enabled}
                      onChange={(e) => {
                        const updated = { ...notification, enabled: e.target.checked };
                        updateNotification(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {notification.enabled && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-medium mb-2">Fréquence</label>
                      <select
                        value={notification.frequency}
                        onChange={(e) => {
                          const updated = { ...notification, frequency: e.target.value };
                          updateNotification(updated);
                        }}
                        className="input"
                      >
                        <option value="immediate">Immédiat</option>
                        <option value="daily">Quotidien</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuel</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Destinataires (emails, séparés par des virgules)
                      </label>
                      <div className="flex items-center gap-2">
                        <Mail className="text-gray-400" size={18} />
                        <input
                          type="text"
                          value={notification.recipients.join(', ')}
                          onChange={(e) => {
                            const recipients = e.target.value.split(',').map((r) => r.trim()).filter(Boolean);
                            const updated = { ...notification, recipients };
                            updateNotification(updated);
                          }}
                          className="input flex-1"
                          placeholder="email1@example.com, email2@example.com"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

