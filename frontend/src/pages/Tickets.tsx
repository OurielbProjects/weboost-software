import { useEffect, useState } from 'react';
import axios from '../utils/api';
import { Plus, MessageSquare, AlertCircle, Clock, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  customer_name?: string;
  created_at: string;
  updated_at: string;
}

export default function Tickets() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    title: '',
    description: '',
    priority: 'medium',
  });
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetchTickets();
    if (user?.role === 'admin') {
      fetchCustomers();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const response = await axios.get('/api/tickets');
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
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
    try {
      if (editingTicket) {
        await axios.put(`/api/tickets/${editingTicket.id}`, formData);
      } else {
        await axios.post('/api/tickets', formData);
      }
      setShowModal(false);
      setEditingTicket(null);
      setFormData({
        customer_id: '',
        title: '',
        description: '',
        priority: 'medium',
      });
      fetchTickets();
    } catch (error: any) {
      console.error('Error saving ticket:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde du ticket');
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setFormData({
      customer_id: '',
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
    });
    setShowModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={16} className="text-blue-500" />;
      case 'in_progress':
        return <Clock size={16} className="text-yellow-500" />;
      case 'resolved':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'closed':
        return <XCircle size={16} className="text-gray-500" />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Ouvert',
      in_progress: 'En cours',
      resolved: 'Résolu',
      closed: 'Fermé',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      high: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
      urgent: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    };
    return colors[priority] || colors.medium;
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gestion du support client</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nouveau ticket
        </button>
      </div>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedTicket(ticket)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(ticket.status)}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {ticket.title}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {ticket.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {ticket.customer_name && <span>Client: {ticket.customer_name}</span>}
                  <span>Statut: {getStatusLabel(ticket.status)}</span>
                  <span>
                    Créé le {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(ticket);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  title="Modifier"
                >
                  <Edit2 size={18} />
                </button>
                <MessageSquare size={20} className="text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {tickets.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Aucun ticket pour le moment</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {editingTicket ? 'Modifier le ticket' : 'Nouveau ticket'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Client *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priorité</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input"
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingTicket ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTicket(null);
                    setFormData({
                      customer_id: '',
                      title: '',
                      description: '',
                      priority: 'medium',
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

