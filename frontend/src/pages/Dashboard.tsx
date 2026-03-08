import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Beef,
  Layers,
  Scale,
  Baby,
  Syringe,
  TrendingUp,
  Calendar,
  DollarSign,
  Percent,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface DashboardData {
  totalAnimais: number;
  totalLotes: number;
  ultimasPesagens: { id: string; data: string; peso: number; animal: { brinco: string } }[];
  proximosPartos: { id: string; dataPrevistaParto: string; animal: { brinco: string } }[];
  vacinacoesRecentes: { id: string; data: string; animal: { brinco: string }; medicamento: { nome: string } }[];
  kpis?: {
    totalRebanho: number;
    idadeMediaAbate: number;
    idadeMediaPrimeiroParto: number;
    rebanhoMedioAnual: number;
    pesoMedioAbate: number;
    taxaVenda: number;
    pesoMedioRebanho: number;
    gmdMedio: number;
    taxaDesmame: number;
  };
  composicaoRebanho?: { name: string; value: number }[];
  historicoEvolucao?: Record<string, string | number>[];
}

const CORES_COMPOSICAO: Record<string, string> = {
  Matrizes: '#ef4444',
  'F.0a12': '#86efac',
  'F.13a24': '#22c55e',
  'F.>24': '#15803d',
  Touros: '#6366f1',
  'M.0a12': '#93c5fd',
  'M.13a24': '#3b82f6',
  'M.25a36': '#1d4ed8',
  'M.>36': '#1e3a8a',
};

const CORES_LINHAS: Record<string, string> = {
  Matrizes: '#ef4444',
  Bezerras: '#eab308',
  Bezerros: '#a16207',
  Touros: '#6366f1',
  'F.0a12': '#86efac',
  'F.13a24': '#22c55e',
  'F.>24': '#15803d',
  'M.0a12': '#93c5fd',
  'M.13a24': '#3b82f6',
  'M.25a36': '#1d4ed8',
  'M.>36': '#1e3a8a',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>('/dashboard')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">Carregando...</span>
      </div>
    );
  }

  const kpis = data.kpis ?? {
    totalRebanho: data.totalAnimais,
    idadeMediaAbate: 0,
    idadeMediaPrimeiroParto: 0,
    rebanhoMedioAnual: data.totalAnimais,
    pesoMedioAbate: 0,
    taxaVenda: 0,
    pesoMedioRebanho: 0,
    gmdMedio: 0,
    taxaDesmame: 0,
  };

  const kpiCards = [
    {
      label: 'Total do Rebanho (Atual)',
      value: `${kpis.totalRebanho} Cab`,
      icon: Beef,
      color: 'bg-green-500',
    },
    {
      label: 'Idade Média ao Abate (Anual)',
      value: `${kpis.idadeMediaAbate} Meses`,
      icon: Calendar,
      color: 'bg-blue-600',
    },
    {
      label: 'Idade Média ao Primeiro Parto (Atual)',
      value: `${kpis.idadeMediaPrimeiroParto} Meses`,
      icon: Baby,
      color: 'bg-blue-600',
    },
    {
      label: 'Rebanho Médio (Anual)',
      value: `${kpis.rebanhoMedioAnual} Cab/Mês`,
      icon: Beef,
      color: 'bg-green-500',
    },
    {
      label: 'Peso Médio ao Abate (Anual)',
      value: `${kpis.pesoMedioAbate} Kg`,
      icon: Scale,
      color: 'bg-gray-800',
    },
    {
      label: 'Taxa de Venda (Anual)',
      value: `${kpis.taxaVenda} %`,
      icon: DollarSign,
      color: 'bg-amber-500',
    },
    {
      label: 'Peso Médio do Rebanho (Atual)',
      value: `${kpis.pesoMedioRebanho} Kg`,
      icon: Scale,
      color: 'bg-amber-700',
    },
    {
      label: 'GMD Médio (Atual)',
      value: `${kpis.gmdMedio} Kg/Cab`,
      icon: TrendingUp,
      color: 'bg-amber-500',
    },
    {
      label: 'Taxa de Desmame (Anual)',
      value: `${kpis.taxaDesmame} %`,
      icon: Percent,
      color: 'bg-red-500',
    },
  ];

  const composicao = (data.composicaoRebanho ?? []).filter((c) => c.value > 0);
  const historico = data.historicoEvolucao ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Bem-vindo ao Gestão Pecuária</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
            <div className={`${color} p-3 rounded-lg text-white flex-shrink-0`}>
              <Icon size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-gray-500 text-xs md:text-sm truncate">{label}</p>
              <p className="text-lg md:text-xl font-bold truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-4">Composição do Rebanho</h2>
          {composicao.length === 0 ? (
            <p className="text-gray-500 text-sm h-64 flex items-center justify-center">Sem dados</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={composicao}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {composicao.map((entry, i) => (
                      <Cell key={entry.name} fill={CORES_COMPOSICAO[entry.name] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-4">Histórico de Evolução do Rebanho</h2>
          {historico.length === 0 ? (
            <p className="text-gray-500 text-sm h-64 flex items-center justify-center">Sem dados</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historico} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {['Matrizes', 'Bezerras', 'Bezerros', 'Touros', 'F.0a12', 'F.13a24', 'F.>24', 'M.0a12', 'M.13a24', 'M.25a36', 'M.>36'].map(
                    (key) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={CORES_LINHAS[key] ?? '#94a3b8'}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    )
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Scale size={20} />
            Últimas pesagens
          </h2>
          {data.ultimasPesagens.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma pesagem registrada</p>
          ) : (
            <ul className="space-y-2">
              {data.ultimasPesagens.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>Brinco {p.animal.brinco}</span>
                  <span className="font-medium">{p.peso} kg</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/pesagens" className="text-primary-600 text-sm mt-2 block">
            Ver todas →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Baby size={20} />
            Próximos partos
          </h2>
          {data.proximosPartos.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum parto previsto</p>
          ) : (
            <ul className="space-y-2">
              {data.proximosPartos.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>Brinco {p.animal.brinco}</span>
                  <span>{new Date(p.dataPrevistaParto).toLocaleDateString('pt-BR')}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/reproducao" className="text-primary-600 text-sm mt-2 block">
            Ir para Reprodução →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4 lg:col-span-2">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Syringe size={20} />
            Vacinações recentes
          </h2>
          {data.vacinacoesRecentes.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma vacinação recente</p>
          ) : (
            <ul className="space-y-2">
              {data.vacinacoesRecentes.map((v) => (
                <li key={v.id} className="flex justify-between text-sm">
                  <span>
                    Brinco {v.animal.brinco} — {v.medicamento.nome}
                  </span>
                  <span>{new Date(v.data).toLocaleDateString('pt-BR')}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/sanidade" className="text-primary-600 text-sm mt-2 block">
            Ir para Sanidade →
          </Link>
        </div>
      </div>
    </div>
  );
}
