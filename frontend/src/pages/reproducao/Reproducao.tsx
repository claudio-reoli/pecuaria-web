import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface EstacaoMonta {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  _count: { diagnosticos: number };
}

interface Parto {
  id: string;
  data: string;
  mae: { brinco: string };
  cria: { brinco: string } | null;
  sexoCria: string;
  pesoAoNascer: number | null;
}

export default function Reproducao() {
  const [estacoes, setEstacoes] = useState<EstacaoMonta[]>([]);
  const [partos, setPartos] = useState<Parto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEstId, setEditEstId] = useState<string | null>(null);
  const [editPartoId, setEditPartoId] = useState<string | null>(null);
  const [formEst, setFormEst] = useState({ nome: '', dataInicio: '', dataFim: '' });
  const [formParto, setFormParto] = useState({ data: '', pesoAoNascer: '', sexoCria: 'F' as 'M'|'F' });

  const load = () => {
    api.get<EstacaoMonta[]>('/reproducao/estacoes').then((e) => setEstacoes(e ?? [])).catch(() => {});
    api.get<Parto[]>('/reproducao/partos').then((p) => setPartos(p ?? [])).catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      api.get<EstacaoMonta[]>('/reproducao/estacoes'),
      api.get<Parto[]>('/reproducao/partos'),
    ])
      .then(([e, p]) => { setEstacoes(e ?? []); setPartos(p ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const abrirEdicaoEst = (e: EstacaoMonta) => {
    setEditEstId(e.id);
    setFormEst({
      nome: e.nome,
      dataInicio: new Date(e.dataInicio).toISOString().slice(0, 10),
      dataFim: new Date(e.dataFim).toISOString().slice(0, 10),
    });
  };

  const salvarEst = async () => {
    if (!editEstId) return;
    await api.patch(`/reproducao/estacoes/${editEstId}`, { nome: formEst.nome, dataInicio: new Date(formEst.dataInicio).toISOString(), dataFim: new Date(formEst.dataFim).toISOString() });
    setEditEstId(null);
    load();
  };

  const abrirEdicaoParto = (p: Parto) => {
    setEditPartoId(p.id);
    setFormParto({
      data: new Date(p.data).toISOString().slice(0, 10),
      pesoAoNascer: p.pesoAoNascer != null ? String(p.pesoAoNascer) : '',
      sexoCria: (p as any).sexoCria || 'F',
    });
  };

  const salvarParto = async () => {
    if (!editPartoId) return;
    await api.patch(`/reproducao/partos/${editPartoId}`, { data: new Date(formParto.data).toISOString(), pesoAoNascer: formParto.pesoAoNascer ? Number(formParto.pesoAoNascer) : undefined, sexoCria: formParto.sexoCria });
    setEditPartoId(null);
    load();
  };

  if (loading) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reprodução</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Estações de monta</h2>
          {editEstId && (
            <div className="mb-4 p-3 bg-gray-50 rounded flex flex-wrap gap-2 items-end">
              <input value={formEst.nome} onChange={(e) => setFormEst({ ...formEst, nome: e.target.value })} placeholder="Nome" className="border rounded px-2 py-1" />
              <input type="date" value={formEst.dataInicio} onChange={(e) => setFormEst({ ...formEst, dataInicio: e.target.value })} className="border rounded px-2 py-1" />
              <input type="date" value={formEst.dataFim} onChange={(e) => setFormEst({ ...formEst, dataFim: e.target.value })} className="border rounded px-2 py-1" />
              <button onClick={salvarEst} className="px-3 py-1 bg-primary-600 text-white rounded text-sm">Salvar</button>
              <button onClick={() => setEditEstId(null)} className="px-3 py-1 border rounded text-sm">Cancelar</button>
            </div>
          )}
          {estacoes.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma estação cadastrada</p>
          ) : (
            <ul className="space-y-2">
              {estacoes.map((e) => (
                <li key={e.id} className="flex justify-between items-center">
                  <span>{e.nome} — {new Date(e.dataInicio).toLocaleDateString('pt-BR')} a {new Date(e.dataFim).toLocaleDateString('pt-BR')} · {e._count?.diagnosticos ?? 0} diagnósticos</span>
                  <button type="button" onClick={() => abrirEdicaoEst(e)} className="text-primary-600 hover:underline text-sm mr-2">Editar</button>
                  <button type="button" onClick={async () => { if (!window.confirm(`Excluir estação ${e.nome}?`)) return; await api.delete(`/reproducao/estacoes/${e.id}`); setEstacoes((prev) => prev.filter((x) => x.id !== e.id)); }} className="text-red-600 hover:underline text-sm">Excluir</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Últimos partos</h2>
          {editPartoId && (
            <div className="mb-4 p-3 bg-gray-50 rounded flex flex-wrap gap-2 items-end">
              <input type="date" value={formParto.data} onChange={(e) => setFormParto({ ...formParto, data: e.target.value })} className="border rounded px-2 py-1" />
              <input type="number" value={formParto.pesoAoNascer} onChange={(e) => setFormParto({ ...formParto, pesoAoNascer: e.target.value })} placeholder="Peso (kg)" className="border rounded px-2 py-1 w-24" />
              <select value={formParto.sexoCria} onChange={(e) => setFormParto({ ...formParto, sexoCria: e.target.value as 'M'|'F' })} className="border rounded px-2 py-1">
                <option value="M">M</option><option value="F">F</option>
              </select>
              <button onClick={salvarParto} className="px-3 py-1 bg-primary-600 text-white rounded text-sm">Salvar</button>
              <button onClick={() => setEditPartoId(null)} className="px-3 py-1 border rounded text-sm">Cancelar</button>
            </div>
          )}
          {partos.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum parto registrado</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm">
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Mãe</th>
                  <th className="pb-2">Cria</th>
                  <th className="pb-2">Sexo</th>
                  <th className="pb-2">Peso (kg)</th>
                  <th className="pb-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {partos.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                    <td>{p.mae.brinco}</td>
                    <td>{p.cria?.brinco ?? '—'}</td>
                    <td>{p.sexoCria === 'M' ? 'M' : 'F'}</td>
                    <td>{p.pesoAoNascer ?? '—'}</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => abrirEdicaoParto(p)} className="text-primary-600 hover:underline text-sm mr-2">Editar</button>
                      <button type="button" onClick={async () => { if (!window.confirm('Excluir parto?')) return; await api.delete(`/reproducao/partos/${p.id}`); setPartos((prev) => prev.filter((x) => x.id !== p.id)); }} className="text-red-600 hover:underline text-sm">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
