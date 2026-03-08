import { Outlet } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Beef,
  Layers,
  Scale,
  Baby,
  Syringe,
  LogOut,
  Menu,
  DollarSign,
  Map,
  Truck,
  HardHat,
  Users,
  CheckSquare,
  Settings,
  Package,
} from 'lucide-react';
import { useState } from 'react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/animais', icon: Beef, label: 'Animais' },
  { to: '/lotes', icon: Layers, label: 'Lotes' },
  { to: '/piquetes', icon: Map, label: 'Piquetes' },
  { to: '/pesagens', icon: Scale, label: 'Pesagens' },
  { to: '/movimentacoes', icon: Truck, label: 'Movimentações' },
  { to: '/reproducao', icon: Baby, label: 'Reprodução' },
  { to: '/sanidade', icon: Syringe, label: 'Sanidade' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { to: '/patrimonio', icon: HardHat, label: 'Patrimônio' },
  { to: '/funcionarios', icon: Users, label: 'Funcionários' },
  { to: '/fornecedores', icon: Package, label: 'Fornecedores' },
  { to: '/tarefas', icon: CheckSquare, label: 'Tarefas' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function Layout() {
  const { user, logout, loadUser } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <span className="font-semibold text-lg">Pecuária</span>
          <button
            className="lg:hidden p-2"
            onClick={() => setSidebarOpen(false)}
          >
            <Menu size={20} />
          </button>
        </div>
        <nav className="p-2 mt-2">
          {nav.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 ${
                location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4">
          <button
            className="lg:hidden p-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user?.name || 'Carregando...'}</span>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
