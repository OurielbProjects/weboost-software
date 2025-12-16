import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoAnimation, setLogoAnimation] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Démarrer l'animation après un court délai
    const timer = setTimeout(() => {
      setLogoAnimation(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div 
              className="text-5xl font-bold flex items-center"
              style={{ 
                fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                letterSpacing: '-0.5px',
                height: '60px'
              }}
            >
              {['W', 'e', 'b', 'o', 'o', 's', 't', '.'].map((letter, index) => {
                const isW = letter === 'W';
                const isDot = letter === '.';
                const delay = index * 0.1; // Délai progressif de 0.1s par lettre
                
                return (
                  <span
                    key={index}
                    className={`inline-block ${
                      isW || isDot ? 'text-[#06b6d4]' : 'text-gray-900 dark:text-white'
                    }`}
                    style={{
                      animation: logoAnimation 
                        ? `letterDrop 0.6s ease-out ${delay}s both`
                        : 'none',
                      transform: logoAnimation ? 'translateY(0)' : 'translateY(-100px)',
                      opacity: logoAnimation ? 1 : 0
                    }}
                  >
                    {letter}
                  </span>
                );
              })}
            </div>
          </div>
          <p 
            className="text-gray-600 dark:text-gray-400 text-sm"
            style={{
              animation: logoAnimation ? 'fadeIn 0.5s ease-out 0.8s both' : 'none',
              opacity: logoAnimation ? 1 : 0
            }}
          >
            Websites Manager
          </p>
          <style>{`
            @keyframes letterDrop {
              0% {
                transform: translateY(-100px);
                opacity: 0;
              }
              60% {
                transform: translateY(10px);
                opacity: 1;
              }
              80% {
                transform: translateY(-5px);
              }
              100% {
                transform: translateY(0);
                opacity: 1;
              }
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}</style>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <LogIn className="text-primary-600 dark:text-primary-400" size={24} />
            <h2 className="text-2xl font-semibold">Connexion</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                placeholder="exemple@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}




