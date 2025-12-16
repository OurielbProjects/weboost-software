import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/api';
import { 
  ArrowLeft, Mail, Phone, Globe, Calendar, FileText, MapPin, 
  Building2, Download, Trash2, Edit2, Plus, Filter, Eye, X,
  CheckCircle, XCircle, Clock, Euro, Key, Save
} from 'lucide-react';
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

interface Invoice {
  id: number;
  customer_id: number;
  invoice_number: string;
  file_path: string;
  amount: number;
  currency: string;
  invoice_date: string;
  due_date?: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingApiKeys, setSavingApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [invoiceViewerUrl, setInvoiceViewerUrl] = useState<string>('');

  // Filtres
  const [filters, setFilters] = useState({
    status: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Formulaire facture
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    amount: '',
    currency: 'EUR',
    invoice_date: '',
    due_date: '',
    status: 'unpaid' as 'paid' | 'unpaid' | 'overdue' | 'cancelled',
    notes: '',
    file: null as File | null,
  });

  useEffect(() => {
    if (id) {
      fetchCustomer();
      fetchInvoices();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchInvoices();
    }
  }, [filters, id]);

  const fetchCustomer = async () => {
    try {
      const response = await axios.get(`/api/customers/${id}`);
      const customerData = response.data.customer;
      setCustomer(customerData);
      // Initialiser les API keys
      setApiKeys(Array.isArray(customerData.api_keys) ? customerData.api_keys : []);
    } catch (error: any) {
      console.error('Error fetching customer:', error);
      if (error.response?.status === 404) {
        navigate('/customers');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    if (!id) return;
    setInvoicesLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`/api/invoices/customer/${id}?${params.toString()}`);
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !invoiceForm.file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', invoiceForm.file);
      formData.append('customer_id', id);
      formData.append('invoice_number', invoiceForm.invoice_number);
      formData.append('amount', invoiceForm.amount);
      formData.append('currency', invoiceForm.currency);
      formData.append('invoice_date', invoiceForm.invoice_date);
      if (invoiceForm.due_date) formData.append('due_date', invoiceForm.due_date);
      formData.append('status', invoiceForm.status);
      if (invoiceForm.notes) formData.append('notes', invoiceForm.notes);

      if (editingInvoice) {
        await axios.put(`/api/invoices/${editingInvoice.id}`, {
          invoice_number: invoiceForm.invoice_number,
          amount: invoiceForm.amount,
          currency: invoiceForm.currency,
          invoice_date: invoiceForm.invoice_date,
          due_date: invoiceForm.due_date || null,
          status: invoiceForm.status,
          notes: invoiceForm.notes || null,
        });
      } else {
        await axios.post('/api/invoices', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setShowInvoiceModal(false);
      setEditingInvoice(null);
      setInvoiceForm({
        invoice_number: '',
        amount: '',
        currency: 'EUR',
        invoice_date: '',
        due_date: '',
        status: 'unpaid',
        notes: '',
        file: null,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchInvoices();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setUploading(false);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      invoice_number: invoice.invoice_number,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date || '',
      status: invoice.status,
      notes: invoice.notes || '',
      file: null,
    });
    setShowInvoiceModal(true);
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;
    try {
      await axios.delete(`/api/invoices/${invoiceId}`);
      fetchInvoices();
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleViewInvoice = async (invoiceId: number) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) return;
      
      // Charger le fichier en blob pour créer une URL d'objet pour la visualisation
      const response = await axios.get(`/api/invoices/${invoiceId}/file?view=true`, {
        responseType: 'blob',
      });
      
      // Créer une URL d'objet pour la visualisation
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/pdf' 
      });
      const blobUrl = window.URL.createObjectURL(blob);
      
      setInvoiceViewerUrl(blobUrl);
      setViewingInvoice(invoice);
    } catch (error) {
      console.error('Error viewing invoice:', error);
      alert('Erreur lors de l\'affichage de la facture');
    }
  };

  const handleDownloadInvoice = async (invoiceId: number) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      const response = await axios.get(`/api/invoices/${invoiceId}/file`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extraire le nom de fichier depuis les headers ou utiliser le numéro de facture
      const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
      let fileName = `invoice-${invoiceId}.pdf`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '');
        }
      } else if (invoice) {
        // Déterminer l'extension depuis le file_path ou utiliser .pdf par défaut
        const fileExt = invoice.file_path ? invoice.file_path.split('.').pop() : 'pdf';
        fileName = `${invoice.invoice_number}.${fileExt}`;
      }
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Erreur lors du téléchargement de la facture');
    }
  };

  const getFileExtension = (filePath: string): string => {
    if (!filePath) return 'pdf';
    return filePath.split('.').pop()?.toLowerCase() || 'pdf';
  };

  const isImageFile = (filePath: string): boolean => {
    const ext = getFileExtension(filePath);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const isPdfFile = (filePath: string): boolean => {
    return getFileExtension(filePath) === 'pdf';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="text-green-600 dark:text-green-400" size={20} />;
      case 'unpaid':
        return <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />;
      case 'overdue':
        return <XCircle className="text-red-600 dark:text-red-400" size={20} />;
      case 'cancelled':
        return <XCircle className="text-gray-600 dark:text-gray-400" size={20} />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'unpaid':
        return 'Non payée';
      case 'overdue':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: '',
    });
  };

  // Gestion des API keys
  const addApiKey = () => {
    setApiKeys([...apiKeys, { type: 'pagespeed', key: '' }]);
  };

  const removeApiKey = (index: number) => {
    setApiKeys(apiKeys.filter((_, i) => i !== index));
  };

  const updateApiKey = (index: number, field: 'type' | 'key', value: string) => {
    const updated = [...apiKeys];
    updated[index] = { ...updated[index], [field]: value };
    setApiKeys(updated);
  };

  const handleSaveApiKeys = async () => {
    if (!id || user?.role !== 'admin') return;
    setSavingApiKeys(true);
    try {
      await axios.put(`/api/customers/${id}`, {
        api_keys: apiKeys,
      });
      // Recharger les données du client
      await fetchCustomer();
      alert('Clés API sauvegardées avec succès !');
    } catch (error: any) {
      console.error('Error saving API keys:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde des clés API');
    } finally {
      setSavingApiKeys(false);
    }
  };

  const getApiKeyLabel = (type: string) => {
    switch (type) {
      case 'pagespeed':
        return 'PageSpeed Insights';
      case 'analytics':
        return 'Google Analytics';
      case 'google-ads':
        return 'Google Ads';
      default:
        return type;
    }
  };

  const totalAmount = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount.toString()), 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, invoice) => sum + parseFloat(invoice.amount.toString()), 0);
  const unpaidAmount = invoices
    .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue')
    .reduce((sum, invoice) => sum + parseFloat(invoice.amount.toString()), 0);

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  if (!customer) {
    return <div className="text-center py-12">Client non trouvé</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft size={20} />
          Retour aux clients
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{customer.name}</h1>
      </div>

      {/* Informations du client */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="text-primary-600 dark:text-primary-400" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Informations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{customer.email}</span>
            </div>
          )}

          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone size={18} className="text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{customer.phone}</span>
            </div>
          )}

          {customer.company_number && (
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">SIRET: {customer.company_number}</span>
            </div>
          )}

          {customer.website_url && (
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-gray-500 dark:text-gray-400" />
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
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">
                Depuis {new Date(customer.collaboration_start_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}

          {customer.address && (
            <div className="flex items-start gap-2 md:col-span-2">
              <MapPin size={18} className="text-gray-500 dark:text-gray-400 mt-1" />
              <span className="text-gray-700 dark:text-gray-300">{customer.address}</span>
            </div>
          )}

          {customer.services && Array.isArray(customer.services) && customer.services.length > 0 && (
            <div className="md:col-span-2">
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

      {/* Section API Keys */}
      {user?.role === 'admin' && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Key className="text-primary-600 dark:text-primary-400" size={24} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Clés API</h2>
            </div>
            <button
              onClick={addApiKey}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Plus size={18} />
              Ajouter une clé
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {apiKeys.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
                Aucune clé API configurée. Cliquez sur "Ajouter une clé" pour en ajouter une.
              </p>
            ) : (
              apiKeys.map((apiKey, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Type de clé</label>
                      <select
                        value={apiKey.type}
                        onChange={(e) => updateApiKey(index, 'type', e.target.value)}
                        className="input w-full"
                      >
                        <option value="pagespeed">PageSpeed Insights</option>
                        <option value="analytics">Google Analytics</option>
                        <option value="google-ads">Google Ads</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Clé API ({getApiKeyLabel(apiKey.type)})
                      </label>
                      <input
                        type="text"
                        value={apiKey.key}
                        onChange={(e) => updateApiKey(index, 'key', e.target.value)}
                        className="input w-full"
                        placeholder={`Entrez la clé ${getApiKeyLabel(apiKey.type)}`}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeApiKey(index)}
                    className="btn btn-secondary px-3 mt-6"
                    title="Supprimer cette clé"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          {apiKeys.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleSaveApiKeys}
                disabled={savingApiKeys}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                {savingApiKeys ? 'Sauvegarde...' : 'Sauvegarder les clés API'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Section Factures */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="text-primary-600 dark:text-primary-400" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Factures</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Filter size={18} />
              Filtres
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setEditingInvoice(null);
                  setInvoiceForm({
                    invoice_number: '',
                    amount: '',
                    currency: 'EUR',
                    invoice_date: '',
                    due_date: '',
                    status: 'unpaid',
                    notes: '',
                    file: null,
                  });
                  setShowInvoiceModal(true);
                }}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Nouvelle facture
              </button>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Euro size={20} className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalAmount.toFixed(2)} €
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payées</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {paidAmount.toFixed(2)} €
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={20} className="text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Impayées</span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {unpaidAmount.toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input"
                >
                  <option value="">Tous</option>
                  <option value="paid">Payée</option>
                  <option value="unpaid">Non payée</option>
                  <option value="overdue">En retard</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Montant min (€)</label>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Montant max (€)</label>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date début</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date fin</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="btn btn-secondary w-full"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des factures */}
        {invoicesLoading ? (
          <div className="text-center py-8">Chargement des factures...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            Aucune facture pour le moment
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Numéro
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Montant
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Échéance
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {invoice.invoice_number}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {parseFloat(invoice.amount.toString()).toFixed(2)} {invoice.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        <span className="text-gray-700 dark:text-gray-300">
                          {getStatusLabel(invoice.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {invoice.due_date
                        ? new Date(invoice.due_date).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                          title="Visualiser"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          title="Télécharger"
                        >
                          <Download size={18} />
                        </button>
                        {user?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleEditInvoice(invoice)}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                              title="Modifier"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pour visualiser une facture */}
      {viewingInvoice && invoiceViewerUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Facture {viewingInvoice.invoice_number}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(viewingInvoice.invoice_date).toLocaleDateString('fr-FR')} - {parseFloat(viewingInvoice.amount.toString()).toFixed(2)} {viewingInvoice.currency}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadInvoice(viewingInvoice.id)}
                  className="btn btn-secondary flex items-center gap-2"
                  title="Télécharger"
                >
                  <Download size={18} />
                  Télécharger
                </button>
                <button
                  onClick={() => {
                    // Révoquer l'URL d'objet pour libérer la mémoire
                    if (invoiceViewerUrl && invoiceViewerUrl.startsWith('blob:')) {
                      window.URL.revokeObjectURL(invoiceViewerUrl);
                    }
                    setViewingInvoice(null);
                    setInvoiceViewerUrl('');
                  }}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Fermer"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {isImageFile(viewingInvoice.file_path) ? (
                <div className="flex justify-center">
                  <img
                    src={invoiceViewerUrl}
                    alt={`Facture ${viewingInvoice.invoice_number}`}
                    className="max-w-full h-auto rounded-lg shadow-lg"
                    style={{ maxHeight: 'calc(90vh - 120px)' }}
                  />
                </div>
              ) : isPdfFile(viewingInvoice.file_path) ? (
                <iframe
                  src={invoiceViewerUrl}
                  className="w-full rounded-lg shadow-lg"
                  style={{ height: 'calc(90vh - 120px)', minHeight: '600px' }}
                  title={`Facture ${viewingInvoice.invoice_number}`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <FileText size={64} className="text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Ce type de fichier ne peut pas être visualisé directement.
                  </p>
                  <button
                    onClick={() => handleDownloadInvoice(viewingInvoice.id)}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Download size={18} />
                    Télécharger pour voir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal pour ajouter/modifier une facture */}
      {showInvoiceModal && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingInvoice ? 'Modifier la facture' : 'Nouvelle facture'}
            </h2>
            <form onSubmit={handleInvoiceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Numéro de facture *</label>
                  <input
                    type="text"
                    value={invoiceForm.invoice_number}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Montant (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date de facture *</label>
                  <input
                    type="date"
                    value={invoiceForm.invoice_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date d'échéance</label>
                  <input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Statut *</label>
                  <select
                    value={invoiceForm.status}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        status: e.target.value as 'paid' | 'unpaid' | 'overdue' | 'cancelled',
                      })
                    }
                    className="input"
                    required
                  >
                    <option value="unpaid">Non payée</option>
                    <option value="paid">Payée</option>
                    <option value="overdue">En retard</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Devise</label>
                  <select
                    value={invoiceForm.currency}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, currency: e.target.value })}
                    className="input"
                  >
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (Dollar)</option>
                    <option value="ILS">ILS (Shekel)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              {!editingInvoice && (
                <div>
                  <label className="block text-sm font-medium mb-2">Fichier *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        file: e.target.files?.[0] || null,
                      })
                    }
                    className="input"
                    required={!editingInvoice}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Formats acceptés : PDF, DOC, DOCX, JPG, JPEG, PNG (max 10MB)
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1" disabled={uploading}>
                  {uploading ? 'Enregistrement...' : editingInvoice ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInvoiceModal(false);
                    setEditingInvoice(null);
                    setInvoiceForm({
                      invoice_number: '',
                      amount: '',
                      currency: 'EUR',
                      invoice_date: '',
                      due_date: '',
                      status: 'unpaid',
                      notes: '',
                      file: null,
                    });
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
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

