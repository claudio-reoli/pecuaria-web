import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [animais, setAnimais] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const MOTIVOS = [
    { value: 'abate interno', label: 'Abate Interno' },
    { value: 'morte', label: 'Morte' },
    { value: 'participação em exposição', label: 'Participação em exposição' },
    { value: 'perda', label: 'Perda' },
    { value: 'roubo', label: 'Roubo' },
    { value: 'transferência', label: 'Transferência' },
    { value: 'venda', label: 'Venda' },
  ];
  const CAUSAS_MORTE = [
    { value: 'acidente ofídico', label: 'Acidente Ofídico' },
    { value: 'acidente/trauma', label: 'Acidente/Trauma' },
    { value: 'acidose ruminal e timpanismo', label: 'Acidose Ruminal e Timpanismo' },
    { value: 'botulismo', label: 'Botulismo' },
    { value: 'brucelose', label: 'Brucelose' },
    { value: 'carbúnculo sintomático', label: 'Carbúnculo Sintomático' },
    { value: 'complicações pós parto', label: 'Complicações pós Parto' },
    { value: 'deficiência nutricional', label: 'Deficiência Nutricional' },
    { value: 'descarga elétrica', label: 'Descarga Elétrica' },
    { value: 'desnutrição', label: 'Desnutrição' },
    { value: 'diarréia', label: 'Diarréia' },
    { value: 'febre aftosa', label: 'Febre Aftosa' },
    { value: 'intoxicação', label: 'Intoxicação' },
    { value: 'morte indefinida', label: 'Morte Indefinida' },
    { value: 'morte natural', label: 'Morte Natural' },
    { value: 'pneumonia', label: 'Pneumonia' },
    { value: 'podridão dos cascos', label: 'Podridão dos Cascos' },
    { value: 'raiva', label: 'Raiva' },
    { value: 'tristeza parasitária bovina', label: 'Tristeza Parasitária Bovina' },
    { value: 'verminose', label: 'Verminose' },
  ];
  const CAUSAS_VENDA = [
    { value: 'abate', label: 'Abate' },
    { value: 'aprumo/conformação', label: 'Aprumo/Conformação' },
    { value: 'baixa produção', label: 'Baixa Produção' },
    { value: 'genética', label: 'Genética' },
    { value: 'idade', label: 'Idade' },
    { value: 'problema reprodutivo', label: 'Problema Reprodutivo' },
    { value: 'recria', label: 'Recria' },
    { value: 'temperamento', label: 'Temperamento' },
  ];
  const [form, setForm] = useState({ animalId: '', loteDestinoId: '', data: new Date().toISOString().slice(0, 10), motivo: '', causa: '', observacao: '' });
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => api.get<any[]>('/movimentacoes').then((r) => setMovimentacoes(r ?? []));
  useEffect(() => {
    setLoading(true);
    api.get<any[]>('/animais').then((r) => setAnimais(r ?? []));
    api.get<any[]>('/lotes').then((r) => setLotes(r ?? []));
    load().finally(() => setLoading(false));
  }, []);

  const abrirEdicao = (m: any) => {
    setEditId(m.id);
    setForm({
      animalId: m.animalId,
      loteDestinoId: m.loteDestinoId ?? '',
      data: new Date(m.data).toISOString().slice(0, 10),
      motivo: m.motivo ?? '',
      causa: m.causa ?? '',
      observacao: m.observacao ?? '',
    });
  };

  const cancelar = () => {
    setEditId(null);
    setForm({ animalId: '', loteDestinoId: '', data: new Date().toISOString().slice(0, 10), motivo: '', causa: '', observacao: '' });
  };

  const registrar = async () => {
    if (!form.animalId) return alert('Selecione o animal.');
    const ehSaida = ['morte', 'venda', 'abate interno', 'perda', 'roubo'].includes(form.motivo);
    if (!ehSaida && !form.loteDestinoId) return alert('Selecione o lote de destino.');
    const payload = {
      ...form,
      data: new Date(form.data).toISOString(),
      loteDestinoId: form.loteDestinoId || null,
    };
    if (editId) {
      await api.patch(`/movimentacoes/${editId}`, payload);
    } else {
      await api.post('/movimentacoes', payload);
    }
    load();
    cancelar();
  };

  const excluir = async (m: any) => {
    if (!window.confirm(`Excluir movimentação do brinco ${m.animal?.brinco}?`)) return;
    await api.delete(`/movimentacoes/${m.id}`);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Movimentações</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow mb-6 max-w-2xl">
        <h2 className="font-semibold text-gray-800 mb-4">{editId ? 'Editar movimentação' : 'Nova movimentação'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Animal</label>
            <select
              value={form.animalId}
              onChange={(e) => setForm({ ...form, animalId: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Selecione o animal</option>
              {animais.map((a) => (
                <option key={a.id} value={a.id}>Brinco {a.brinco}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Lote destino</label>
            <select
              value={form.loteDestinoId}
              onChange={(e) => setForm({ ...form, loteDestinoId: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">
                {['morte', 'venda', 'abate interno', 'perda', 'roubo'].includes(form.motivo)
                  ? 'Saída (não aplicável)'
                  : 'Selecione o lote'}
              </option>
              {lotes.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Data</label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Motivo</label>
            <select
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value, causa: '' })}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Selecione</option>
              {MOTIVOS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          {(form.motivo === 'morte' || form.motivo === 'venda') && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Causa</label>
              <select
                value={form.causa}
                onChange={(e) => setForm({ ...form, causa: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Selecione</option>
                {(form.motivo === 'morte' ? CAUSAS_MORTE : CAUSAS_VENDA).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">Observação</label>
            <textarea
              value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              placeholder="Observações adicionais..."
              rows={2}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={registrar}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Salvar
          </button>
          {editId && (
            <button
              onClick={cancelar}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Carregando...</p>
        ) : movimentacoes.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Nenhuma movimentação registrada</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Brinco</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Destino</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Motivo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Causa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Observação</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.map((m) => (
                <tr key={m.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 font-medium">{m.animal?.brinco}</td>
                  <td className="px-4 py-3">{m.loteDestino?.nome ?? '—'}</td>
                  <td className="px-4 py-3">{MOTIVOS.find((x) => x.value === m.motivo)?.label ?? m.motivo}</td>
                  <td className="px-4 py-3">{m.causa ? ([...CAUSAS_MORTE, ...CAUSAS_VENDA].find((x) => x.value === m.causa)?.label ?? m.causa) : '—'}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={m.observacao ?? ''}>{m.observacao || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => abrirEdicao(m)}
                      className="text-primary-600 hover:underline mr-3"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => excluir(m)}
                      className="text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
