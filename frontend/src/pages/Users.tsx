import { useEffect, useState } from 'react';
import axios from '../utils/api';
import { Plus, Trash2, Shield, User, X, Key } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface UserData {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'client';
  created_at: string;
}

export default function Users() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'client' as 'admin' | 'client',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser?.role]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, formData);
      } else {
        await axios.post('/api/users', formData);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        email: '',
        name: '',
        password: '',
        role: 'client',
      });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    try {
      await axios.put(`/api/users/${selectedUser?.id}`, {
        password: passwordData.newPassword,
      });
      setShowPasswordModal(false);
      setSelectedUser(null);
      setPasswordData({
        newPassword: '',
        confirmPassword: '',
      });
      alert('Mot de passe modifié avec succès');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erreur lors de la modification du mot de passe');
    }
  };

  const handleUserClick = (user: UserData) => {
    setSelectedUser(user);
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
    });
    setShowModal(true);
  };

  const handleChangePassword = (user: UserData, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(user);
    setPasswordData({
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswordModal(true);
  };

  const deleteUser = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Accès refusé</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const adminUsers = users.filter((u) => u.role === 'admin');
  const clientUsers = users.filter((u) => u.role === 'client');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gestion des utilisateurs</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              email: '',
              name: '',
              password: '',
              role: 'client',
            });
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nouvel utilisateur
        </button>
      </div>

      {/* Section Administrateurs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="text-primary-600 dark:text-primary-400" size={24} />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Administrateurs ({adminUsers.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <Shield className="text-primary-600 dark:text-primary-400" size={24} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      ID: {user.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="px-2 py-1 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                  Administrateur
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleChangePassword(user, e)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Changer le mot de passe"
                  >
                    <Key size={18} />
                  </button>
                  {user.id !== currentUser?.id && (
                    <button
                      onClick={(e) => deleteUser(user.id, e)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Clients */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <User className="text-gray-600 dark:text-gray-400" size={24} />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Clients ({clientUsers.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <User className="text-gray-600 dark:text-gray-400" size={24} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      ID: {user.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Client
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleChangePassword(user, e)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Changer le mot de passe"
                  >
                    <Key size={18} />
                  </button>
                  {user.id !== currentUser?.id && (
                    <button
                      onClick={(e) => deleteUser(user.id, e)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {editingUser ? 'Détails de l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  setSelectedUser(null);
                  setFormData({
                    email: '',
                    name: '',
                    password: '',
                    role: 'client',
                  });
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">ID</label>
                <input
                  type="text"
                  value={editingUser?.id || 'Nouveau'}
                  className="input bg-gray-100 dark:bg-gray-700"
                  disabled
                />
              </div>
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
                <label className="block text-sm font-medium mb-2">Email (Identifiant) *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium mb-2">Mot de passe *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'client' })}
                  className="input"
                >
                  <option value="client">Client</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              {editingUser && (
                <div>
                  <label className="block text-sm font-medium mb-2">Date de création</label>
                  <input
                    type="text"
                    value={new Date(editingUser.created_at).toLocaleDateString('fr-FR')}
                    className="input bg-gray-100 dark:bg-gray-700"
                    disabled
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setSelectedUser(null);
                    setFormData({
                      email: '',
                      name: '',
                      password: '',
                      role: 'client',
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

      {/* Modal de changement de mot de passe */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Changer le mot de passe</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUser(null);
                  setPasswordData({
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Utilisateur:</strong> {selectedUser.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Email:</strong> {selectedUser.email}
              </p>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nouveau mot de passe *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="input"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirmer le mot de passe *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="input"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  Modifier le mot de passe
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                    setPasswordData({
                      newPassword: '',
                      confirmPassword: '',
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
