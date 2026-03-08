import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AnimaisList from './pages/animais/AnimaisList';
import AnimalForm from './pages/animais/AnimalForm';
import LotesList from './pages/lotes/LotesList';
import LoteForm from './pages/lotes/LoteForm';
import PesagemList from './pages/pesagem/PesagemList';
import PesagemForm from './pages/pesagem/PesagemForm';
import Reproducao from './pages/reproducao/Reproducao';
import Sanidade from './pages/sanidade/Sanidade';
import Financeiro from './pages/financeiro/Financeiro';
import PiquetesList from './pages/piquetes/PiquetesList';
import Movimentacoes from './pages/movimentacoes/Movimentacoes';
import Patrimonio from './pages/patrimonio/Patrimonio';
import Funcionarios from './pages/funcionarios/Funcionarios';
import Tarefas from './pages/tarefas/Tarefas';
import Configuracoes from './pages/configuracoes/Configuracoes';
import Fornecedores from './pages/fornecedores/Fornecedores';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="animais" element={<AnimaisList />} />
        <Route path="animais/novo" element={<AnimalForm />} />
        <Route path="animais/:id" element={<AnimalForm />} />
        <Route path="lotes" element={<LotesList />} />
        <Route path="lotes/novo" element={<LoteForm />} />
        <Route path="lotes/:id" element={<LoteForm />} />
        <Route path="pesagens" element={<PesagemList />} />
        <Route path="pesagens/nova" element={<PesagemForm />} />
        <Route path="pesagens/:id" element={<PesagemForm />} />
        <Route path="reproducao" element={<Reproducao />} />
        <Route path="sanidade" element={<Sanidade />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="piquetes" element={<PiquetesList />} />
        <Route path="movimentacoes" element={<Movimentacoes />} />
        <Route path="patrimonio" element={<Patrimonio />} />
        <Route path="funcionarios" element={<Funcionarios />} />
        <Route path="tarefas" element={<Tarefas />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="fornecedores" element={<Fornecedores />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthInit() {
  const { token, loadUser } = useAuth();
  useEffect(() => {
    if (token) loadUser();
  }, [token, loadUser]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthInit />
      <AppRoutes />
    </AuthProvider>
  );
}
