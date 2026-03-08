import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';

const categorias = ['BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI'];
const fasesProdutivas = ['CRIA', 'RECRIA', 'ENGORDA', 'MATRIZES', 'REPRODUTORES'];

export default function LoteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [propriedades, setPropriedades] = useState<{ id: string; nome: string }[]>([]);
  const [piquetes, setPiquetes] = useState<{ id: string; nome: string }[]>([]);
  const [form, setForm] = useState({
    propriedadeId: '',
    nome: '',
    categoria: 'NOVILHA',
    faseProdutiva: '',
    responsavel: '',
    piqueteId: '',
    metaGMD: '',
    metaPesoAbate: '',
    dataFormacao: '',
    ativo: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ id: string; nome: string }[]>('/propriedades').then(setPropriedades);
  }, []);

  useEffect(() => {
    if (form.propriedadeId) api.get(`/piquetes?propriedadeId=${form.propriedadeId}`).then((p: any) => setPiquetes(p));
    else setPiquetes([]);
  }, [form.propriedadeId]);
  useEffect(() => {
    if (id && id !== 'novo') {
      api.get<any>(`/lotes/${id}`).then((l) => {
        setForm({
          propriedadeId: l.propriedadeId,
          nome: l.nome,
          categoria: l.categoria,
          faseProdutiva: l.faseProdutiva || '',
          responsavel: l.responsavel || '',
          piqueteId: l.piqueteId || '',
          metaGMD: l.metaGMD?.toString() || '',
          metaPesoAbate: l.metaPesoAbate?.toString() || '',
          dataFormacao: l.dataFormacao ? l.dataFormacao.slice(0, 10) : '',
          ativo: l.ativo !== false,
        });
      });
    } else if (propriedades[0]) {
      setForm((f) => ({ ...f, propriedadeId: propriedades[0].id }));
    }
  }, [id, propriedades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        piqueteId: form.piqueteId || undefined,
        metaGMD: form.metaGMD ? Number(form.metaGMD) : undefined,
        metaPesoAbate: form.metaPesoAbate ? Number(form.metaPesoAbate) : undefined,
        dataFormacao: form.dataFormacao || undefined,
        faseProdutiva: form.faseProdutiva || undefined,
      };
      if (id && id !== 'novo') {
        await api.patch(`/lotes/${id}`, payload);
      } else {
        await api.post('/lotes', payload);
      }
      navigate('/lotes');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {id && id !== 'novo' ? 'Editar lote' : 'Novo lote'}
      </h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 bg-white p-6 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Propriedade</label>
          <select
            value={form.propriedadeId}
            onChange={(e) => setForm({ ...form, propriedadeId: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Selecione</option>
            {propriedades.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nome *</label>
          <input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fase produtiva</label>
          <select
            value={form.faseProdutiva}
            onChange={(e) => setForm({ ...form, faseProdutiva: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Selecione</option>
            {fasesProdutivas.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <select
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          >
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Meta GMD (kg/dia)</label>
          <input
            type="number"
            step="0.01"
            value={form.metaGMD}
            onChange={(e) => setForm({ ...form, metaGMD: e.target.value })}
            placeholder="0,00"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Meta de peso de abate (kg)</label>
          <input
            type="number"
            step="0.1"
            value={form.metaPesoAbate}
            onChange={(e) => setForm({ ...form, metaPesoAbate: e.target.value })}
            placeholder="0"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data de formação</label>
          <input
            type="date"
            value={form.dataFormacao}
            onChange={(e) => setForm({ ...form, dataFormacao: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Piquete</label>
          <select value={form.piqueteId} onChange={(e) => setForm({ ...form, piqueteId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
            <option value="">Nenhum</option>
            {piquetes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={form.ativo}
            onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="ativo" className="text-sm font-medium">Lote ativo</label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Responsável</label>
          <input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/lotes')}
            className="px-4 py-2 border rounded-lg"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
