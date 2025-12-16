import { useEffect, useState } from 'react';
import axios from '../utils/api';
import { FileText, Save, Eye, Code, Palette, Mail, Send } from 'lucide-react';
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
  const [, setTemplates] = useState<ReportTemplate[]>([]);
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
  const [activeTab, setActiveTab] = useState<'templates' | 'send'>('templates');
  
  // État pour l'envoi manuel
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<string>('bugs');
  const [recipients, setRecipients] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  const reportTypes = [
    { type: 'bugs', label: 'Rapport de Bugs', description: 'Template pour les alertes de bugs' },
    { type: 'weekly_report', label: 'Rapport Hebdomadaire', description: 'Template pour les rapports hebdomadaires' },
    { type: 'monthly_report', label: 'Rapport Mensuel', description: 'Template pour les rapports mensuels' },
  ];

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchTemplates();
      fetchProjects();
    }
  }, [user]);

  // Préremplir les emails des clients lorsque des projets sont sélectionnés
  useEffect(() => {
    if (selectedProjects.length > 0 && projects.length > 0) {
      // Récupérer les emails uniques des clients des projets sélectionnés
      const selectedProjectsData = projects.filter(p => selectedProjects.includes(p.id));
      const customerEmails = selectedProjectsData
        .map(p => p.customer_email)
        .filter((email): email is string => !!email && email.trim() !== '')
        .filter((email, index, self) => self.indexOf(email) === index); // Supprimer les doublons
      
      if (customerEmails.length > 0) {
        // Récupérer les emails actuels dans le champ
        const currentEmails = recipients.split(',').map(e => e.trim()).filter(e => e);
        
        // Fusionner les emails des clients avec ceux déjà présents (sans doublons)
        // On met les emails des clients en premier pour qu'ils soient visibles
        const allEmails = [...new Set([...customerEmails, ...currentEmails])];
        
        // Ne mettre à jour que si les emails ont changé (pour éviter les boucles infinies)
        const newRecipients = allEmails.join(', ');
        if (newRecipients !== recipients) {
          setRecipients(newRecipients);
        }
      }
    }
    // Note: On ne vide pas automatiquement le champ si les projets sont désélectionnés
    // pour permettre à l'utilisateur de garder les emails qu'il a saisis
  }, [selectedProjects]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
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

  const handleSendReport = async () => {
    if (selectedProjects.length === 0) {
      alert('Veuillez sélectionner au moins un projet');
      return;
    }

    const recipientsList = recipients.split(',').map(email => email.trim()).filter(email => email);
    if (recipientsList.length === 0) {
      alert('Veuillez saisir au moins un destinataire');
      return;
    }

    setSending(true);
    setSendResult(null);
    try {
      const response = await axios.post('/api/reports/send', {
        reportType: selectedReportType,
        projectIds: selectedProjects,
        recipients: recipientsList,
        customSubject: customSubject || undefined,
      });

      setSendResult(response.data);
      if (response.data.success) {
        alert(`✅ ${response.data.sent} rapport(s) envoyé(s) avec succès !`);
        // Réinitialiser le formulaire
        setSelectedProjects([]);
        setRecipients('');
        setCustomSubject('');
      } else {
        alert(`⚠️ ${response.data.sent} envoyé(s), ${response.data.failed} échec(s)`);
      }
    } catch (error: any) {
      console.error('Error sending report:', error);
      alert(error.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
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
          Éditez les templates HTML/CSS et envoyez des rapports manuellement
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'templates'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <FileText size={20} className="inline mr-2" />
          Templates
        </button>
        <button
          onClick={() => setActiveTab('send')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'send'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Mail size={20} className="inline mr-2" />
          Envoyer un rapport
        </button>
      </div>

      {/* Contenu de l'onglet Envoyer */}
      {activeTab === 'send' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Envoyer un rapport manuellement
            </h2>

            {/* Type de rapport */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Type de rapport</label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="input"
              >
                {reportTypes.map((type) => (
                  <option key={type.type} value={type.type}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélection des projets */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Projets ({selectedProjects.length} sélectionné(s))
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {projects.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">Aucun projet disponible</p>
                ) : (
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <label key={project.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjects([...selectedProjects, project.id]);
                            } else {
                              setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                            }
                          }}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {project.domain} {project.customer_name && `(${project.customer_name})`}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setSelectedProjects(projects.map(p => p.id))}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Tout sélectionner
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => setSelectedProjects([])}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>

            {/* Destinataires */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Destinataires (emails séparés par des virgules)
              </label>
              <textarea
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="Les emails des clients sélectionnés seront préremplis automatiquement"
                className="input min-h-[100px]"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Les emails des clients des projets sélectionnés sont automatiquement ajoutés. Vous pouvez modifier ou ajouter d'autres emails.
              </p>
              {selectedProjects.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                  💡 Astuce : Les emails des clients des projets sélectionnés sont automatiquement inclus. Vous pouvez les modifier ou en ajouter d'autres.
                </div>
              )}
            </div>

            {/* Sujet personnalisé (optionnel) */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Sujet personnalisé (optionnel)
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Laissez vide pour utiliser le sujet par défaut"
                className="input"
              />
            </div>

            {/* Bouton d'envoi */}
            <button
              onClick={handleSendReport}
              disabled={sending || selectedProjects.length === 0 || !recipients.trim()}
              className="btn btn-primary flex items-center gap-2 w-full sm:w-auto"
            >
              <Send size={18} />
              {sending ? 'Envoi en cours...' : 'Envoyer le rapport'}
            </button>

            {/* Résultat de l'envoi */}
            {sendResult && (
              <div className={`mt-4 p-4 rounded-lg ${
                sendResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              }`}>
                <p className={`font-medium ${
                  sendResult.success 
                    ? 'text-green-900 dark:text-green-300' 
                    : 'text-yellow-900 dark:text-yellow-300'
                }`}>
                  {sendResult.success 
                    ? `✅ ${sendResult.sent} rapport(s) envoyé(s) avec succès` 
                    : `⚠️ ${sendResult.sent} envoyé(s), ${sendResult.failed} échec(s)`}
                </p>
                {sendResult.results && sendResult.results.length > 0 && (
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-medium">Projets envoyés :</p>
                    <ul className="list-disc list-inside mt-1">
                      {sendResult.results.map((r: any, idx: number) => (
                        <li key={idx}>{r.domain} - {r.recipientsCount} destinataire(s)</li>
                      ))}
                    </ul>
                  </div>
                )}
                {sendResult.errors && sendResult.errors.length > 0 && (
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p className="font-medium">Erreurs :</p>
                    <ul className="list-disc list-inside mt-1">
                      {sendResult.errors.map((e: any, idx: number) => (
                        <li key={idx}>{e.domain || `Projet ${e.projectId}`}: {e.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenu de l'onglet Templates */}
      {activeTab === 'templates' && (
        <div>
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
      )}
    </div>
  );
}

