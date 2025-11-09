import { useEffect, useState } from 'react';
import axios from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { FolderKanban, Users, Ticket, CheckSquare, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    projects: 0,
    customers: 0,
    tickets: 0,
    checklist: 0,
    openTickets: 0,
    alerts: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [projectsRes, customersRes, ticketsRes, checklistRes] = await Promise.all([
          axios.get('/api/projects'),
          axios.get('/api/customers'),
          axios.get('/api/tickets'),
          axios.get('/api/checklist'),
        ]);

        const projects = projectsRes.data.projects || [];
        const tickets = ticketsRes.data.tickets || [];
        const openTickets = tickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress');

        // Compter les alertes
        const alerts = projects.reduce((acc: number, p: any) => {
          const projectAlerts = p.alerts || [];
          return acc + (Array.isArray(projectAlerts) ? projectAlerts.length : 0);
        }, 0);

        setStats({
          projects: projects.length,
          customers: customersRes.data.customers?.length || 0,
          tickets: tickets.length,
          checklist: checklistRes.data.items?.length || 0,
          openTickets: openTickets.length,
          alerts,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { icon: FolderKanban, label: 'Projets', value: stats.projects, color: 'text-blue-600 dark:text-blue-400' },
    { icon: Users, label: 'Clients', value: stats.customers, color: 'text-green-600 dark:text-green-400' },
    { icon: Ticket, label: 'Tickets', value: stats.tickets, color: 'text-purple-600 dark:text-purple-400' },
    { icon: CheckSquare, label: 'Tâches', value: stats.checklist, color: 'text-orange-600 dark:text-orange-400' },
    { icon: TrendingUp, label: 'Tickets ouverts', value: stats.openTickets, color: 'text-yellow-600 dark:text-yellow-400' },
    { icon: AlertTriangle, label: 'Alertes', value: stats.alerts, color: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Bienvenue, {user?.name} ! Voici un aperçu de votre activité.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <Icon size={40} className={stat.color} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


