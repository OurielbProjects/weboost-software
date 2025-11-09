import { useEffect, useState, useRef } from 'react';
import axios from '../utils/api';
import { Settings as SettingsIcon, Upload, X, Image as ImageIcon, Building2, Mail, Phone, MapPin, Save, FileText, AlertCircle, Headphones } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Settings {
  id?: number;
  logo_path?: string;
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  company_number?: string;
  support_email?: string;
  alert_email?: string;
}

export default function Settings() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings(response.data.settings || {});
      
      // Charger l'aperçu du logo si disponible
      if (response.data.settings?.logo_path && user?.id) {
        setLogoPreview(`/api/settings/logo/${user.id}?t=${Date.now()}`);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Seuls les fichiers image (JPEG, PNG, GIF, SVG, WEBP) sont autorisés');
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (maximum 5MB)');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await axios.post('/api/settings/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSettings(response.data.settings);
      if (user?.id) {
        setLogoPreview(`/api/settings/logo/${user.id}?t=${Date.now()}`);
      }
      alert('Logo uploadé avec succès !');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert(error.response?.data?.error || 'Erreur lors de l\'upload du logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer le logo ?')) return;

    try {
      await axios.delete('/api/settings/logo');
      setSettings({ ...settings, logo_path: undefined });
      setLogoPreview('');
      alert('Logo supprimé avec succès !');
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      alert(error.response?.data?.error || 'Erreur lors de la suppression du logo');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put('/api/settings', {
        company_name: settings.company_name,
        company_email: settings.company_email,
        company_phone: settings.company_phone,
        company_address: settings.company_address,
        company_number: settings.company_number,
        support_email: settings.support_email,
        alert_email: settings.alert_email,
      });
      setSettings(response.data.settings);
      alert('Paramètres sauvegardés avec succès !');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Paramètres</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gérez vos paramètres personnels et votre logo
        </p>
      </div>

      {/* Upload Logo */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <ImageIcon className="text-primary-600 dark:text-primary-400" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Logo</h2>
        </div>
        
        <div className="flex items-start gap-6">
          {/* Aperçu du logo */}
          <div className="flex-shrink-0">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-32 h-32 object-contain border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-800"
                />
                <button
                  onClick={handleDeleteLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Supprimer le logo"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <ImageIcon className="text-gray-400" size={32} />
              </div>
            )}
          </div>

          {/* Zone d'upload */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Le logo sera affiché sur tous vos rapports. Formats acceptés : JPEG, PNG, GIF, SVG, WEBP (max 5MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="btn btn-primary inline-flex items-center gap-2 cursor-pointer"
            >
              <Upload size={18} />
              {uploading ? 'Upload en cours...' : logoPreview ? 'Changer le logo' : 'Uploader un logo'}
            </label>
          </div>
        </div>
      </div>

      {/* Informations de l'entreprise */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="text-primary-600 dark:text-primary-400" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Informations de l'entreprise</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Building2 className="inline mr-2" size={16} />
              Nom de l'entreprise
            </label>
            <input
              type="text"
              value={settings.company_name || ''}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              className="input"
              placeholder="Nom de votre entreprise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Mail className="inline mr-2" size={16} />
              Email
            </label>
            <input
              type="email"
              value={settings.company_email || ''}
              onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
              className="input"
              placeholder="contact@entreprise.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Phone className="inline mr-2" size={16} />
              Téléphone
            </label>
            <input
              type="tel"
              value={settings.company_phone || ''}
              onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
              className="input"
              placeholder="+33 1 23 45 67 89"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <FileText className="inline mr-2" size={16} />
              Numéro de Société
            </label>
            <input
              type="text"
              value={settings.company_number || ''}
              onChange={(e) => setSettings({ ...settings, company_number: e.target.value })}
              className="input"
              placeholder="SIRET, SIREN, etc."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              <MapPin className="inline mr-2" size={16} />
              Adresse
            </label>
            <textarea
              value={settings.company_address || ''}
              onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
              className="input"
              rows={3}
              placeholder="Adresse complète de votre entreprise"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder les informations'}
          </button>
        </div>
      </div>

      {/* Configuration des emails */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="text-primary-600 dark:text-primary-400" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Configuration des emails</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Headphones className="inline mr-2" size={16} />
              Email de support (expéditeur des rapports)
            </label>
            <input
              type="email"
              value={settings.support_email || ''}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              className="input"
              placeholder="support@entreprise.com"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cet email sera utilisé comme expéditeur pour tous les rapports envoyés à vos clients
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <AlertCircle className="inline mr-2" size={16} />
              Email d'alerte (destinataire des alertes)
            </label>
            <input
              type="email"
              value={settings.alert_email || ''}
              onChange={(e) => setSettings({ ...settings, alert_email: e.target.value })}
              className="input"
              placeholder="alertes@entreprise.com"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cet email recevra toutes les alertes de bugs et notifications importantes
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder les emails'}
          </button>
        </div>
      </div>
    </div>
  );
}

