import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/api';
import { Plus, ExternalLink, AlertTriangle, CheckCircle, XCircle, Trash2, Edit2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

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

interface Customer {
  id: number;
  name: string;
}

export default function Projects() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    domain: '',
    url: '',
    status: 'active',
  });

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin') {
      fetchCustomers();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') return;

    try {
      if (editingProject) {
        // Modification
        await axios.put(`/api/projects/${editingProject.id}`, {
          ...formData,
          customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
        });
      } else {
        // Création
        await axios.post('/api/projects', {
          ...formData,
          customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
        });
      }
      setShowModal(false);
      setEditingProject(null);
      setFormData({
        customer_id: '',
        domain: '',
        url: '',
        status: 'active',
      });
      fetchProjects();
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde du projet');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      customer_id: project.customer_id?.toString() || '',
      domain: project.domain,
      url: project.url,
      status: project.status,
    });
    setShowModal(true);
  };

  const deleteProject = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    try {
      await axios.delete(`/api/projects/${id}`);
      fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const getHealthColor = (score: number = 100) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gestion de vos sites internet</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nouveau projet
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {project.domain}
                </h3>
                {project.customer_name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{project.customer_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={20} />
                </a>
                {user?.role === 'admin' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(project);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      title="Modifier"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Santé</span>
                <span className={`font-semibold ${getHealthColor(project.health_score)}`}>
                  {project.health_score || 100}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Statut</span>
                <span className={`text-sm font-medium ${
                  project.status === 'active' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {project.status === 'active' ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle size={16} />
                      Actif
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle size={16} />
                      Inactif
                    </span>
                  )}
                </span>
              </div>

              {project.broken_links && Array.isArray(project.broken_links) && project.broken_links.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle size={16} />
                  <span>{project.broken_links.length} lien(s) cassé(s)</span>
                </div>
              )}

              {project.alerts && Array.isArray(project.alerts) && project.alerts.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle size={16} />
                  <span>{project.alerts.length} alerte(s)</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Aucun projet pour le moment</p>
        </div>
      )}

      {showModal && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client (optionnel)</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="input"
                >
                  <option value="">Aucun client</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Domaine *</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="input"
                  placeholder="example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input"
                  placeholder="https://example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingProject ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
                    setFormData({
                      customer_id: '',
                      domain: '',
                      url: '',
                      status: 'active',
                    });
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


