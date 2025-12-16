import { useEffect, useState } from 'react';
import axios from '../utils/api';
import { Plus, Check, Trash2, Edit2, Calendar, Filter } from 'lucide-react';

interface ChecklistItem {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export default function Checklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [sortByUrgency, setSortByUrgency] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    deadline: '',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/checklist');
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`/api/checklist/${editingItem.id}`, formData);
      } else {
        await axios.post('/api/checklist', formData);
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        deadline: '',
      });
      fetchItems();
    } catch (error: any) {
      console.error('Error saving item:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde de la tâche');
    }
  };

  const handleEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      priority: item.priority || 'medium',
      deadline: item.deadline || '',
    });
    setShowModal(true);
  };

  // Calculer le score d'urgence d'une tâche
  const getUrgencyScore = (item: ChecklistItem): number => {
    if (item.completed) return -1; // Les tâches complétées en dernier
    
    let score = 0;
    
    // Score basé sur la priorité
    const priorityScores: Record<string, number> = {
      urgent: 100,
      high: 75,
      medium: 50,
      low: 25,
    };
    score += priorityScores[item.priority || 'medium'] || 50;
    
    // Score basé sur la deadline
    if (item.deadline) {
      const deadline = new Date(item.deadline);
      const now = new Date();
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        // Deadline passée = très urgent
        score += 100;
      } else if (diffDays === 0) {
        // Deadline aujourd'hui
        score += 80;
      } else if (diffDays <= 1) {
        // Deadline demain
        score += 60;
      } else if (diffDays <= 3) {
        // Deadline dans 3 jours
        score += 40;
      } else if (diffDays <= 7) {
        // Deadline dans une semaine
        score += 20;
      }
    }
    
    return score;
  };

  // Trier les tâches par urgence
  const sortItemsByUrgency = (items: ChecklistItem[]): ChecklistItem[] => {
    return [...items].sort((a, b) => {
      if (sortByUrgency) {
        return getUrgencyScore(b) - getUrgencyScore(a);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const toggleComplete = async (item: ChecklistItem) => {
    try {
      await axios.put(`/api/checklist/${item.id}`, { completed: !item.completed });
      fetchItems();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    try {
      await axios.delete(`/api/checklist/${id}`);
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const completedItems = items.filter((item) => item.completed);
  const pendingItems = sortItemsByUrgency(items.filter((item) => !item.completed));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CheckList</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gestion de vos tâches personnelles</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSortByUrgency(!sortByUrgency)}
            className={`btn ${sortByUrgency ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
            title={sortByUrgency ? 'Trier par urgence' : 'Trier par date'}
          >
            <Filter size={18} />
            {sortByUrgency ? 'Par urgence' : 'Par date'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nouvelle tâche
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {pendingItems.length} tâche(s) en attente • {completedItems.length} tâche(s) terminée(s)
        </p>
      </div>

      <div className="space-y-4">
        {pendingItems.map((item) => {
          const isOverdue = item.deadline && new Date(item.deadline) < new Date();
          const daysUntilDeadline = item.deadline
            ? Math.ceil((new Date(item.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;

          const getPriorityColor = (priority?: string) => {
            const colors: Record<string, string> = {
              urgent: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
              high: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
              medium: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
              low: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
            };
            return colors[priority || 'medium'] || colors.medium;
          };

          return (
            <div key={item.id} className="card flex items-start gap-4">
              <button
                onClick={() => toggleComplete(item)}
                className="mt-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded"></div>
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                  {item.priority && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority === 'urgent' ? 'Urgent' :
                       item.priority === 'high' ? 'Haute' :
                       item.priority === 'medium' ? 'Moyenne' : 'Faible'}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                  <span>Créé le {new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                  {item.deadline && (
                    <span className={`flex items-center gap-1 ${
                      isOverdue
                        ? 'text-red-600 dark:text-red-400 font-semibold'
                        : daysUntilDeadline !== null && daysUntilDeadline <= 1
                        ? 'text-orange-600 dark:text-orange-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      <Calendar size={12} />
                      {isOverdue
                        ? `Deadline dépassée (${new Date(item.deadline).toLocaleDateString('fr-FR')})`
                        : daysUntilDeadline === 0
                        ? `Deadline aujourd'hui`
                        : daysUntilDeadline === 1
                        ? `Deadline demain`
                        : `Deadline: ${new Date(item.deadline).toLocaleDateString('fr-FR')} (${daysUntilDeadline}j)`}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}

        {completedItems.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Tâches terminées
            </h2>
            {completedItems.map((item) => (
              <div key={item.id} className="card flex items-start gap-4 opacity-60">
                <button
                  onClick={() => toggleComplete(item)}
                  className="mt-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                </button>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-through">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-through">
                      {item.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Terminé le {item.completed_at ? new Date(item.completed_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Aucune tâche pour le moment</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {editingItem ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Urgence</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="input"
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Deadline (optionnel)</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="input"
                />
                {formData.deadline && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deadline: '' })}
                    className="text-sm text-red-600 dark:text-red-400 mt-1 hover:underline"
                  >
                    Supprimer la deadline
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingItem ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    setFormData({
                      title: '',
                      description: '',
                      priority: 'medium',
                      deadline: '',
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


