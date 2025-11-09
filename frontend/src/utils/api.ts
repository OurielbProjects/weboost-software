import axios from 'axios';

// En production, utiliser l'URL de l'API depuis les variables d'environnement
// En développement, utiliser le proxy Vite
const API_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL 
  : import.meta.env.PROD 
    ? '' // Production: même domaine si déployé ensemble
    : ''; // Dev: proxy Vite

axios.defaults.baseURL = API_URL;

// Intercepteur pour afficher les erreurs
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erreur de réponse du serveur
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      // Pas de réponse du serveur
      console.error('❌ API Error: No response from server', {
        url: error.config?.url,
      });
      console.error('💡 Vérifiez que le backend est démarré sur http://localhost:5000');
      console.error('   Exécutez: cd backend && npm run dev');
    } else {
      // Erreur lors de la configuration de la requête
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axios;
