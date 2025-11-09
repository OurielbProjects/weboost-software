import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/api';
import { Plus, Mail, Phone, Globe, Calendar, FileText, Trash2, Edit2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ApiKey {
  type: 'pagespeed' | 'analytics' | 'google-ads';
  key: string;
}

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company_number?: string;
  website_url?: string;
  collaboration_start_date?: string;
  services?: string[];
  custom_fields?: any;
  api_keys?: ApiKey[];
}

export default function Customers() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company_number: '',
    website_url: '',
    collaboration_start_date: '',
    services: [] as string[],
    api_keys: [] as ApiKey[],
  });

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') return;

    try {
      if (editingCustomer) {
        await axios.put(`/api/customers/${editingCustomer.id}`, formData);
      } else {
        await axios.post('/api/customers', formData);
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        company_number: '',
        website_url: '',
        collaboration_start_date: '',
        services: [],
        api_keys: [],
      });
      fetchCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde du client');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      company_number: customer.company_number || '',
      website_url: customer.website_url || '',
      collaboration_start_date: customer.collaboration_start_date || '',
      services: Array.isArray(customer.services) ? customer.services : [],
      api_keys: Array.isArray(customer.api_keys) ? customer.api_keys : [],
    });
    setShowModal(true);
  };

  const addApiKey = () => {
    setFormData({
      ...formData,
      api_keys: [...formData.api_keys, { type: 'pagespeed', key: '' }],
    });
  };

  const removeApiKey = (index: number) => {
    setFormData({
      ...formData,
      api_keys: formData.api_keys.filter((_, i) => i !== index),
    });
  };

  const updateApiKey = (index: number, field: 'type' | 'key', value: string) => {
    const updated = [...formData.api_keys];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, api_keys: updated });
  };

  const deleteCustomer = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action supprimera également tous les projets associés.')) return;
    try {
      await axios.delete(`/api/customers/${id}`);
      fetchCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gestion de vos clients</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nouveau client
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div 
            key={customer.id} 
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/customers/${customer.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                {customer.name}
              </h3>
              {user?.role === 'admin' && (
                <div className="flex items-center gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(customer);
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    title="Modifier"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomer(customer.id);
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail size={16} />
                  <span>{customer.email}</span>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone size={16} />
                  <span>{customer.phone}</span>
                </div>
              )}

              {customer.company_number && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FileText size={16} />
                  <span>SIRET: {customer.company_number}</span>
                </div>
              )}

              {customer.website_url && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe size={16} />
                  <a
                    href={customer.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {customer.website_url}
                  </a>
                </div>
              )}

              {customer.collaboration_start_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar size={16} />
                  <span>
                    Depuis {new Date(customer.collaboration_start_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}

              {customer.services && Array.isArray(customer.services) && customer.services.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Services :</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.services.map((service, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-xs"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {customers.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Aucun client pour le moment</p>
        </div>
      )}

      {showModal && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {editingCustomer ? 'Modifier le client' : 'Nouveau client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Numéro de Société</label>
                <input
                  type="text"
                  value={formData.company_number}
                  onChange={(e) => setFormData({ ...formData, company_number: e.target.value })}
                  className="input"
                  placeholder="SIRET, SIREN, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Site web</label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="input"
                />
              </div>

              {/* Clés API */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Clés API</label>
                  <button
                    type="button"
                    onClick={addApiKey}
                    className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                  >
                    <Plus size={16} />
                    Ajouter une clé
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.api_keys.map((apiKey, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <select
                        value={apiKey.type}
                        onChange={(e) => updateApiKey(index, 'type', e.target.value)}
                        className="input flex-shrink-0 w-48"
                      >
                        <option value="pagespeed">PageSpeed Insights</option>
                        <option value="analytics">Google Analytics</option>
                        <option value="google-ads">Google Ads</option>
                      </select>
                      <input
                        type="text"
                        value={apiKey.key}
                        onChange={(e) => updateApiKey(index, 'key', e.target.value)}
                        className="input flex-1"
                        placeholder={`Clé ${apiKey.type === 'pagespeed' ? 'PageSpeed Insights' : apiKey.type === 'analytics' ? 'Google Analytics' : 'Google Ads'}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeApiKey(index)}
                        className="btn btn-secondary px-3"
                        title="Supprimer cette clé"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.api_keys.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Aucune clé API configurée. Cliquez sur "+" pour en ajouter.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingCustomer ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      address: '',
                      company_number: '',
                      website_url: '',
                      collaboration_start_date: '',
                      services: [],
                      api_keys: [],
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

