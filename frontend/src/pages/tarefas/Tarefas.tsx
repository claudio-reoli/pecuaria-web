import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus } from 'lucide-react';

export default function Tarefas() {
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [propId, setPropId] = useState('');
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [novo, setNovo] = useState({ titulo: '', descricao: '', dataPrevista: new Date().toISOString().slice(0, 10), funcionarioId: '', prioridade: 'normal' });

  useEffect(() => { api.get('/propriedades').then((p: any) => { setPropriedades(p); if (p[0]) setPropId(p[0].id); }); }, []);
  useEffect(() => { if (propId) { api.get<any[]>(`/funcionarios?propriedadeId=${propId}`).then((r) => setFuncionarios(r ?? [])); api.get<any[]>(`/tarefas?propriedadeId=${propId}&concluida=false`).then((r) => setTarefas(r ?? [])); } }, [propId]);

  const abrirEdicao = (t: any) => {
    setEditId(t.id);
    setNovo({
      titulo: t.titulo ?? '',
      descricao: t.descricao ?? '',
      dataPrevista: t.dataPrevista ? new Date(t.dataPrevista).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      funcionarioId: t.funcionarioId ?? '',
      prioridade: t.prioridade ?? 'normal',
    });
    setForm(true);
  };

  const cancelar = () => {
    setForm(false);
    setEditId(null);
    setNovo({ titulo: '', descricao: '', dataPrevista: new Date().toISOString().slice(0, 10), funcionarioId: '', prioridade: 'normal' });
  };

  const salvar = async () => {
    const payload = { ...novo, propriedadeId: propId, dataPrevista: new Date(novo.dataPrevista).toISOString(), funcionarioId: novo.funcionarioId || undefined };
    if (editId) {
      await api.patch(`/tarefas/${editId}`, payload);
    } else {
      await api.post('/tarefas', payload);
    }
    const lista = await api.get<any[]>(`/tarefas?propriedadeId=${propId}&concluida=false`);
    setTarefas(lista ?? []);
    cancelar();
  };

  const excluir = async (t: any) => {
    if (!window.confirm(`Excluir tarefa "${t.titulo}"?`)) return;
    await api.delete(`/tarefas/${t.id}`);
    setTarefas((prev) => prev.filter((x) => x.id !== t.id));
  };

  const concluir = async (id: string) => {
    await api.patch(`/tarefas/${id}`, { concluida: true });
    setTarefas((t) => t.filter((x) => x.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tarefas</h1>
      <div className="flex gap-4 mb-4">
        <select value={propId} onChange={(e) => setPropId(e.target.value)} className="border rounded px-3 py-2">{propriedades.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
        <button onClick={() => setForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg"><Plus size={18} /> Nova tarefa</button>
      </div>
      {form && (
        <div className="bg-white p-4 rounded shadow mb-4 max-w-lg">
          <input placeholder="Título" value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} className="border rounded px-2 py-1 w-full mb-2" />
          <input placeholder="Descrição" value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} className="border rounded px-2 py-1 w-full mb-2" />
          <input type="date" value={novo.dataPrevista} onChange={(e) => setNovo({ ...novo, dataPrevista: e.target.value })} className="border rounded px-2 py-1 w-full mb-2" />
          <select value={novo.funcionarioId} onChange={(e) => setNovo({ ...novo, funcionarioId: e.target.value })} className="border rounded px-2 py-1 w-full mb-2"><option value="">Sem responsável</option>{funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
          <div className="flex gap-2"><button onClick={salvar} className="px-3 py-1 bg-primary-600 text-white rounded">Salvar</button><button onClick={cancelar} className="px-3 py-1 border rounded">Cancelar</button></div>
        </div>
      )}
      <div className="space-y-2">
        {tarefas.map((t) => (
          <div key={t.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div><p className="font-medium">{t.titulo}</p><p className="text-sm text-gray-500">{t.descricao} · {t.funcionario?.nome || 'Sem responsável'} · {new Date(t.dataPrevista).toLocaleDateString('pt-BR')}</p></div>
            <div className="flex gap-2">
              <button onClick={() => abrirEdicao(t)} className="px-3 py-1 text-primary-600 hover:underline text-sm">Editar</button>
              <button onClick={() => excluir(t)} className="px-3 py-1 text-red-600 hover:underline text-sm">Excluir</button>
              <button onClick={() => concluir(t.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">Concluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
