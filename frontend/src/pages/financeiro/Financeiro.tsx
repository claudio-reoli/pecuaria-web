import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function Financeiro() {
  const [propriedades, setPropriedades] = useState<{ id: string; nome: string }[]>([]);
  const [propId, setPropId] = useState('');
  const [receitas, setReceitas] = useState<any[]>([]);
  const [despesas, setDespesas] = useState<any[]>([]);
  const [dre, setDre] = useState<any>(null);
  const [tab, setTab] = useState<'visao' | 'receitas' | 'despesas'>('visao');
  const [form, setForm] = useState({ data: new Date().toISOString().slice(0, 10), valor: '', categoria: 'outros', descricao: '' });
  const [editRecId, setEditRecId] = useState<string | null>(null);
  const [editDespId, setEditDespId] = useState<string | null>(null);

  useEffect(() => { api.get('/propriedades').then((p: any) => { setPropriedades(p); if (p[0]) setPropId(p[0].id); }); }, []);
  useEffect(() => {
    if (!propId) return;
    const mes = new Date().getMonth() + 1;
    const ano = new Date().getFullYear();
    Promise.all([
      api.get<any[]>(`/financeiro/receitas?propriedadeId=${propId}`).then((r) => setReceitas(r ?? [])),
      api.get<any[]>(`/financeiro/despesas?propriedadeId=${propId}`).then((r) => setDespesas(r ?? [])),
      api.get(`/financeiro/dre?propriedadeId=${propId}&mes=${mes}&ano=${ano}`).then((r) => setDre(r)),
    ]);
  }, [propId, tab]);

  const salvar = async (tipo: 'receitas' | 'despesas') => {
    const payload = { ...form, propriedadeId: propId, valor: Number(form.valor) };
    if (tipo === 'receitas' && editRecId) {
      await api.patch(`/financeiro/receitas/${editRecId}`, payload);
      setEditRecId(null);
    } else if (tipo === 'despesas' && editDespId) {
      await api.patch(`/financeiro/despesas/${editDespId}`, payload);
      setEditDespId(null);
    } else {
      await api.post(`/financeiro/${tipo}`, payload);
    }
    setForm({ ...form, valor: '', descricao: '' });
    if (tipo === 'receitas') {
      const lista = await api.get<any[]>(`/financeiro/receitas?propriedadeId=${propId}`);
      setReceitas(lista ?? []);
    } else {
      const lista = await api.get<any[]>(`/financeiro/despesas?propriedadeId=${propId}`);
      setDespesas(lista ?? []);
    }
  };

  const abrirEdicaoRec = (r: any) => {
    setEditRecId(r.id);
    setEditDespId(null);
    setForm({
      data: new Date(r.data).toISOString().slice(0, 10),
      valor: String(r.valor),
      categoria: r.categoria || 'outros',
      descricao: r.descricao || '',
    });
  };

  const abrirEdicaoDesp = (d: any) => {
    setEditDespId(d.id);
    setEditRecId(null);
    setForm({
      data: new Date(d.data).toISOString().slice(0, 10),
      valor: String(d.valor),
      categoria: d.categoria || 'outros',
      descricao: d.descricao || '',
    });
  };

  const excluirRec = async (r: any) => {
    if (!window.confirm('Excluir receita?')) return;
    await api.delete(`/financeiro/receitas/${r.id}`);
    setReceitas((prev) => prev.filter((x) => x.id !== r.id));
  };

  const excluirDesp = async (d: any) => {
    if (!window.confirm('Excluir despesa?')) return;
    await api.delete(`/financeiro/despesas/${d.id}`);
    setDespesas((prev) => prev.filter((x) => x.id !== d.id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Financeiro</h1>
      <select value={propId} onChange={(e) => setPropId(e.target.value)} className="mb-4 border rounded px-3 py-2">
        {propriedades.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>

      <div className="flex gap-2 mb-4">
        {(['visao', 'receitas', 'despesas'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
            {t === 'visao' ? 'DRE' : t === 'receitas' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      {tab === 'visao' && dre && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow"><p className="text-gray-500">Receitas</p><p className="text-xl text-green-600">R$ {dre.totalReceitas?.toFixed(2)}</p></div>
          <div className="bg-white p-4 rounded-lg shadow"><p className="text-gray-500">Despesas</p><p className="text-xl text-red-600">R$ {dre.totalDespesas?.toFixed(2)}</p></div>
          <div className="bg-white p-4 rounded-lg shadow"><p className="text-gray-500">Resultado</p><p className={`text-xl ${dre.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {dre.resultado?.toFixed(2)}</p></div>
        </div>
      )}

      {tab === 'receitas' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-end">
            <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="border rounded px-2 py-1" />
            <input type="number" placeholder="Valor" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="border rounded px-2 py-1 w-24" />
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="border rounded px-2 py-1"><option value="venda_animais">Venda animais</option><option value="outros">Outros</option></select>
            <input placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="border rounded px-2 py-1 w-40" />
            <button onClick={() => salvar('receitas')} className="px-3 py-1 bg-green-600 text-white rounded">{editRecId ? 'Salvar' : 'Adicionar'}</button>
          </div>
          <div className="bg-white rounded shadow overflow-auto max-h-64"><table className="w-full"><thead className="bg-gray-50"><tr><th className="text-left p-2">Data</th><th className="text-left p-2">Valor</th><th className="text-left p-2">Categoria</th><th className="text-left p-2">Descrição</th><th className="text-right p-2">Ações</th></tr></thead><tbody>{receitas.map((r) => <tr key={r.id} className="border-t"><td className="p-2">{new Date(r.data).toLocaleDateString('pt-BR')}</td><td className="p-2 text-green-600">R$ {r.valor?.toFixed(2)}</td><td className="p-2">{r.categoria}</td><td className="p-2">{r.descricao || '—'}</td><td className="p-2 text-right"><button type="button" onClick={() => abrirEdicaoRec(r)} className="text-primary-600 hover:underline text-sm mr-2">Editar</button><button type="button" onClick={() => excluirRec(r)} className="text-red-600 hover:underline text-sm">Excluir</button></td></tr>)}</tbody></table></div>
        </div>
      )}

      {tab === 'despesas' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-end">
            <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="border rounded px-2 py-1" />
            <input type="number" placeholder="Valor" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="border rounded px-2 py-1 w-24" />
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="border rounded px-2 py-1"><option value="alimentacao">Alimentação</option><option value="medicamentos">Medicamentos</option><option value="mao_obra">Mão de obra</option><option value="outros">Outros</option></select>
            <input placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="border rounded px-2 py-1 w-40" />
            <button onClick={() => salvar('despesas')} className="px-3 py-1 bg-red-600 text-white rounded">{editDespId ? 'Salvar' : 'Adicionar'}</button>
          </div>
          <div className="bg-white rounded shadow overflow-auto max-h-64"><table className="w-full"><thead className="bg-gray-50"><tr><th className="text-left p-2">Data</th><th className="text-left p-2">Valor</th><th className="text-left p-2">Categoria</th><th className="text-left p-2">Descrição</th><th className="text-right p-2">Ações</th></tr></thead><tbody>{despesas.map((d) => <tr key={d.id} className="border-t"><td className="p-2">{new Date(d.data).toLocaleDateString('pt-BR')}</td><td className="p-2 text-red-600">R$ {d.valor?.toFixed(2)}</td><td className="p-2">{d.categoria}</td><td className="p-2">{d.descricao || '—'}</td><td className="p-2 text-right"><button type="button" onClick={() => abrirEdicaoDesp(d)} className="text-primary-600 hover:underline text-sm mr-2">Editar</button><button type="button" onClick={() => excluirDesp(d)} className="text-red-600 hover:underline text-sm">Excluir</button></td></tr>)}</tbody></table></div>
        </div>
      )}
    </div>
  );
}
