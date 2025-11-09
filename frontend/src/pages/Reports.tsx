import { useEffect, useState } from 'react';
import axios from '../utils/api';
import { FileText, Save, Eye, Code, Palette } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ReportTemplate {
  id?: number;
  type: string;
  name: string;
  html_template: string;
  css_styles: string;
}

export default function Reports() {
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<string>('bugs');
  const [currentTemplate, setCurrentTemplate] = useState<ReportTemplate>({
    type: 'bugs',
    name: 'Rapport de bugs',
    html_template: '',
    css_styles: '',
  });
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const reportTypes = [
    { type: 'bugs', label: 'Rapport de Bugs', description: 'Template pour les alertes de bugs' },
    { type: 'weekly_report', label: 'Rapport Hebdomadaire', description: 'Template pour les rapports hebdomadaires' },
    { type: 'monthly_report', label: 'Rapport Mensuel', description: 'Template pour les rapports mensuels' },
  ];

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchTemplates();
    }
  }, [user]);

  useEffect(() => {
    if (selectedType) {
      loadTemplate(selectedType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentTemplate.html_template) {
        generatePreview();
      }
    }, 500); // Debounce de 500ms pour éviter trop de requêtes

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTemplate.html_template, currentTemplate.css_styles, selectedType]);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/reports/templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (type: string) => {
    try {
      const response = await axios.get(`/api/reports/templates/${type}`);
      setCurrentTemplate(response.data.template);
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const generatePreview = async () => {
    try {
      if (!currentTemplate.html_template) return;
      
      const response = await axios.post(`/api/reports/preview/${selectedType}`, {
        html_template: currentTemplate.html_template,
        css_styles: currentTemplate.css_styles,
      });
      setPreviewHtml(response.data.html);
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewHtml('<p style="color: red;">Erreur lors de la génération de l\'aperçu</p>');
    }
  };

  const handleSave = async () => {
    if (user?.role !== 'admin') return;
    
    setSaving(true);
    try {
      await axios.post('/api/reports/templates', {
        type: selectedType,
        name: reportTypes.find(t => t.type === selectedType)?.label || selectedType,
        html_template: currentTemplate.html_template,
        css_styles: currentTemplate.css_styles,
      });
      alert('Template sauvegardé avec succès !');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Accès refusé</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Rapports</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Éditez les templates HTML/CSS pour vos rapports
        </p>
      </div>

      {/* Sélection du type de rapport */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <FileText className="text-primary-600 dark:text-primary-400" size={24} />
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Type de rapport</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input"
            >
              {reportTypes.map((type) => (
                <option key={type.type} value={type.type}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Eye size={18} />
            {showPreview ? 'Masquer' : 'Aperçu'}
          </button>
        </div>
      </div>

      {/* Variables disponibles */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-3">Variables disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-2">Projet :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{project.domain}}'}</code></li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{project.url}}'}</code></li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{project.health_score}}'}</code></li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{project.status}}'}</code></li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Client :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{customer.name}}'}</code></li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{customer.email}}'}</code></li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Trafic :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{traffic.visitors}}'}</code></li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{traffic.pageviews}}'}</code></li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Performance :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{performance.score}}'}</code></li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{performance.loadTime}}'}</code></li>
            </ul>
          </div>
          {selectedType === 'bugs' && (
            <div className="col-span-2">
              <p className="font-medium mb-2">Alertes (boucle) :</p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
{`{{#alerts}}
  <li>{{message}} - {{date}}</li>
{{/alerts}}`}
              </pre>
            </div>
          )}
          <div className="col-span-2">
            <p className="font-medium mb-2">Entreprise :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{company.name}}'}</code></li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{company.email}}'}</code></li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{company.phone}}'}</code></li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{company.address}}'}</code></li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{company.logo}}'}</code> (affiche le logo en image)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Éditeur */}
      <div className={showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
        {/* Éditeur HTML/CSS */}
        <div className={showPreview ? '' : 'w-full'}>
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Code className="text-primary-600 dark:text-primary-400" size={20} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Template HTML</h2>
            </div>
            <textarea
              value={currentTemplate.html_template}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, html_template: e.target.value })}
              className="w-full h-96 font-mono text-sm p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Entrez votre template HTML ici..."
            />
          </div>

          <div className="card mt-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="text-primary-600 dark:text-primary-400" size={20} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Styles CSS</h2>
            </div>
            <textarea
              value={currentTemplate.css_styles}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, css_styles: e.target.value })}
              className="w-full h-64 font-mono text-sm p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Entrez vos styles CSS ici..."
            />
          </div>
        </div>

        {/* Aperçu */}
        {showPreview && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="text-primary-600 dark:text-primary-400" size={20} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Aperçu en temps réel</h2>
            </div>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[800px] border-0"
                title="Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

