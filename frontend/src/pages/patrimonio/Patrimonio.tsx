import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus } from 'lucide-react';

export default function Patrimonio() {
  const [bens, setBens] = useState<any[]>([]);
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [propId, setPropId] = useState('');
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [novo, setNovo] = useState({ descricao: '', categoria: 'maquina', marca: '', valorCompra: '' });

  useEffect(() => { api.get('/propriedades').then((p: any) => { setPropriedades(p); if (p[0]) setPropId(p[0].id); }); }, []);
  useEffect(() => { if (propId) api.get<any[]>(`/patrimonio?propriedadeId=${propId}`).then((r) => setBens(r ?? [])); }, [propId]);

  const abrirEdicao = (b: any) => {
    setEditId(b.id);
    setNovo({
      descricao: b.descricao ?? '',
      categoria: b.categoria ?? 'maquina',
      marca: b.marca ?? '',
      valorCompra: b.valorCompra ? String(b.valorCompra) : '',
    });
    setForm(true);
  };

  const cancelar = () => {
    setForm(false);
    setEditId(null);
    setNovo({ descricao: '', categoria: 'maquina', marca: '', valorCompra: '' });
  };

  const salvar = async () => {
    const payload = { ...novo, propriedadeId: propId, valorCompra: novo.valorCompra ? Number(novo.valorCompra) : undefined };
    if (editId) {
      await api.patch(`/patrimonio/${editId}`, payload);
    } else {
      await api.post('/patrimonio', payload);
    }
    const lista = await api.get<any[]>(`/patrimonio?propriedadeId=${propId}`);
    setBens(lista ?? []);
    cancelar();
  };

  const excluir = async (b: any) => {
    if (!window.confirm(`Excluir bem "${b.descricao}"?`)) return;
    await api.delete(`/patrimonio/${b.id}`);
    setBens((prev) => prev.filter((x) => x.id !== b.id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Patrimônio</h1>
      <div className="flex gap-4 mb-4">
        <select value={propId} onChange={(e) => setPropId(e.target.value)} className="border rounded px-3 py-2">{propriedades.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
        <button onClick={() => setForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg"><Plus size={18} /> Novo bem</button>
      </div>
      {form && (
        <div className="bg-white p-4 rounded shadow mb-4 max-w-md">
          <input placeholder="Descrição" value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} className="border rounded px-2 py-1 w-full mb-2" />
          <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} className="border rounded px-2 py-1 w-full mb-2"><option value="benfeitoria">Benfeitoria</option><option value="maquina">Máquina</option><option value="equipamento">Equipamento</option><option value="implemento">Implemento</option></select>
          <input placeholder="Marca" value={novo.marca} onChange={(e) => setNovo({ ...novo, marca: e.target.value })} className="border rounded px-2 py-1 w-full mb-2" />
          <input type="number" placeholder="Valor compra" value={novo.valorCompra} onChange={(e) => setNovo({ ...novo, valorCompra: e.target.value })} className="border rounded px-2 py-1 w-full mb-2" />
          <div className="flex gap-2"><button onClick={salvar} className="px-3 py-1 bg-primary-600 text-white rounded">Salvar</button><button onClick={cancelar} className="px-3 py-1 border rounded">Cancelar</button></div>
        </div>
      )}
      <div className="bg-white rounded shadow overflow-hidden"><table className="w-full"><thead className="bg-gray-50"><tr><th className="text-left p-3">Descrição</th><th className="text-left p-3">Categoria</th><th className="text-left p-3">Marca</th><th className="text-left p-3">Valor</th><th className="text-right p-3">Ações</th></tr></thead><tbody>{bens.map((b) => <tr key={b.id} className="border-t"><td className="p-3">{b.descricao}</td><td className="p-3">{b.categoria}</td><td className="p-3">{b.marca || '—'}</td><td className="p-3">{b.valorCompra ? `R$ ${b.valorCompra.toFixed(2)}` : '—'}</td><td className="p-3 text-right"><button type="button" onClick={() => abrirEdicao(b)} className="text-primary-600 hover:underline mr-2">Editar</button><button type="button" onClick={() => excluir(b)} className="text-red-600 hover:underline">Excluir</button></td></tr>)}</tbody></table></div>
    </div>
  );
}
