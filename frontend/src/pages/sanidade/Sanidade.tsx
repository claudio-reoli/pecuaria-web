import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ImageCapture } from '../../components/ImageCapture';

const TIPOS_MANEJO = [
  { value: 'Vacina', label: 'Vacina' },
  { value: 'Vermífugo', label: 'Vermífugo' },
  { value: 'Endectocida', label: 'Endectocida' },
  { value: 'Ectoparasiticida', label: 'Ectoparasiticida' },
  { value: 'Antibiótico', label: 'Antibiótico' },
  { value: 'Anti-inflamatório', label: 'Anti-inflamatório' },
  { value: 'Antisséptico', label: 'Antisséptico' },
  { value: 'Cicatrizante', label: 'Cicatrizante' },
  { value: 'Soro', label: 'Soro' },
];

// Formas farmacêuticas pertinentes para cada tipo de manejo (conforme tabela)
const TIPO_MANEJO_FORMAS: Record<string, string[]> = {
  Vacina: ['Injetável'],
  Vermífugo: ['Injetável', 'Pour-on', 'Cápsula Ruminal', 'Mistura Alimentar'],
  Endectocida: ['Injetável', 'Pour-on'],
  Ectoparasiticida: ['Injetável', 'Pour-on', 'Uso Tópico', 'Banho', 'Mistura Alimentar'],
  Antibiótico: ['Injetável', 'Mistura Alimentar'],
  'Anti-inflamatório': ['Injetável', 'Uso Tópico'],
  Antisséptico: ['Comprimido', 'Uso Tópico', 'Banho'],
  Cicatrizante: ['Uso Tópico'],
  Soro: ['Injetável'],
};

// Via de Aplicação conforme (Tipo de Manejo + Forma Farmacêutica) - relação exata da tabela
const TIPO_FORMA_VIAS: Record<string, Record<string, { value: string; label: string }[]>> = {
  Vacina: {
    Injetável: [
      { value: 'Intramuscular (IM)', label: 'Intramuscular (IM)' },
      { value: 'Subcutânea (SC)', label: 'Subcutânea (SC)' },
      { value: 'Intravenosa (IV)', label: 'Intravenosa (IV)' },
      { value: 'Via Oral', label: 'Via Oral' },
    ],
  },
  Vermífugo: {
    Injetável: [
      { value: 'Intramuscular (IM)', label: 'Intramuscular (IM)' },
      { value: 'Subcutânea (SC)', label: 'Subcutânea (SC)' },
    ],
    'Pour-on': [{ value: 'Dorsal', label: 'Dorsal' }],
    'Cápsula Ruminal': [{ value: 'Oral', label: 'Oral' }],
    'Mistura Alimentar': [{ value: 'Oral', label: 'Oral' }],
  },
  Endectocida: {
    Injetável: [
      { value: 'Intramuscular (IM)', label: 'Intramuscular (IM)' },
      { value: 'Subcutânea (SC)', label: 'Subcutânea (SC)' },
      { value: 'Via Oral', label: 'Via Oral' },
    ],
    'Pour-on': [{ value: 'Dorsal', label: 'Dorsal' }],
  },
  Ectoparasiticida: {
    Injetável: [
      { value: 'Intramuscular (IM)', label: 'Intramuscular (IM)' },
      { value: 'Subcutânea (SC)', label: 'Subcutânea (SC)' },
      { value: 'Via Oral', label: 'Via Oral' },
    ],
    'Pour-on': [{ value: 'Dorsal', label: 'Dorsal' }],
    'Uso Tópico': [
      { value: 'Pele', label: 'Pele' },
      { value: 'Spray', label: 'Spray' },
      { value: 'Aerossol', label: 'Aerossol' },
    ],
    Banho: [
      { value: 'Aspersão', label: 'Aspersão' },
      { value: 'Imersão', label: 'Imersão' },
    ],
    'Mistura Alimentar': [{ value: 'Oral', label: 'Oral' }],
  },
  Antibiótico: {
    Injetável: [
      { value: 'Intramuscular (IM)', label: 'Intramuscular (IM)' },
      { value: 'Subcutânea (SC)', label: 'Subcutânea (SC)' },
      { value: 'Intravenosa (IV)', label: 'Intravenosa (IV)' },
      { value: 'Via Oral', label: 'Via Oral' },
    ],
    'Mistura Alimentar': [{ value: 'Via Oral', label: 'Via Oral' }],
  },
  'Anti-inflamatório': {
    Injetável: [
      { value: 'Intramuscular (IM)', label: 'Intramuscular (IM)' },
      { value: 'Subcutânea (SC)', label: 'Subcutânea (SC)' },
      { value: 'Intravenosa (IV)', label: 'Intravenosa (IV)' },
      { value: 'Via Oral', label: 'Via Oral' },
    ],
    'Uso Tópico': [
      { value: 'Pele', label: 'Pele' },
      { value: 'Spray', label: 'Spray' },
      { value: 'Aerossol', label: 'Aerossol' },
    ],
  },
  Antisséptico: {
    Comprimido: [{ value: 'Via Oral', label: 'Via Oral' }],
    'Uso Tópico': [
      { value: 'Pele', label: 'Pele' },
      { value: 'Spray', label: 'Spray' },
      { value: 'Aerossol', label: 'Aerossol' },
    ],
    Banho: [
      { value: 'Aspersão', label: 'Aspersão' },
      { value: 'Imersão', label: 'Imersão' },
    ],
  },
  Cicatrizante: {
    'Uso Tópico': [
      { value: 'Pele', label: 'Pele' },
      { value: 'Spray', label: 'Spray' },
      { value: 'Aerossol', label: 'Aerossol' },
    ],
  },
  Soro: {
    Injetável: [
      { value: 'Intramuscular (IM)', label: 'Intramuscular (IM)' },
      { value: 'Subcutânea (SC)', label: 'Subcutânea (SC)' },
      { value: 'Intravenosa (IV)', label: 'Intravenosa (IV)' },
    ],
  },
};

const emptyForm = {
  propriedadeId: '',
  animalId: '',
  loteId: '',
  data: new Date().toISOString().slice(0, 10),
  tipoManejo: '',
  responsavelPrescricao: '',
  responsavelAplicacao: '',
  medicamento: '',
  fotoProduto: '',
  fotoReceita: '',
  formaFarmaceutica: '',
  dosagemPosologia: '',
  viaAdministracao: '',
  frequenciaDuracao: '',
  carencia: '',
  observacao: '',
};

export default function Sanidade() {
  const [manejos, setManejos] = useState<any[]>([]);
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [animais, setAnimais] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [propId, setPropId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const loadManejos = (propIdFilter?: string) => {
    const q = propIdFilter ? `?propriedadeId=${propIdFilter}` : '';
    return api.get<any[]>(`/manejo-sanitario${q}`).then((r) => setManejos(r ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/propriedades').then((p: any) => {
      setPropriedades(p ?? []);
      if (p?.[0]) setPropId(p[0].id);
    });
    api.get<any[]>('/animais').then((r) => setAnimais(r ?? []));
    api.get<any[]>('/lotes').then((r) => setLotes(r ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    loadManejos(propId || undefined);
  }, [propId]);

  const abrirEdicao = (m: any) => {
    setEditId(m.id);
    setForm({
      propriedadeId: m.propriedadeId ?? '',
      animalId: m.animalId ?? '',
      loteId: m.loteId ?? '',
      data: new Date(m.data).toISOString().slice(0, 10),
      tipoManejo: m.tipoManejo ?? '',
      responsavelPrescricao: m.responsavelPrescricao ?? '',
      responsavelAplicacao: m.responsavelAplicacao ?? '',
      medicamento: m.medicamento ?? '',
      fotoProduto: m.fotoProduto ?? '',
      fotoReceita: m.fotoReceita ?? '',
      formaFarmaceutica: m.formaFarmaceutica ?? '',
      dosagemPosologia: m.dosagemPosologia ?? '',
      viaAdministracao: m.viaAdministracao ?? '',
      frequenciaDuracao: m.frequenciaDuracao ?? '',
      carencia: m.carencia ?? '',
      observacao: m.observacao ?? '',
    });
    setFormOpen(true);
  };

  const cancelar = () => {
    setFormOpen(false);
    setEditId(null);
    setForm({ ...emptyForm, propriedadeId: propId });
  };

  const salvar = async () => {
    if (!form.animalId) return alert('Selecione o animal.');
    if (!form.tipoManejo) return alert('Selecione o tipo de manejo.');
    const payload = {
      ...form,
      propriedadeId: form.propriedadeId || propId,
      data: new Date(form.data).toISOString(),
      loteId: form.loteId || null,
    };
    if (editId) {
      await api.patch(`/manejo-sanitario/${editId}`, payload);
    } else {
      await api.post('/manejo-sanitario', payload);
    }
    cancelar();
    setLoading(true);
    loadManejos(propId);
  };

  const excluir = async (m: any) => {
    if (!window.confirm(`Excluir registro de manejo do brinco ${m.animal?.brinco}?`)) return;
    await api.delete(`/manejo-sanitario/${m.id}`);
    setLoading(true);
    loadManejos(propId);
  };

  const animaisFiltrados = propId ? animais.filter((a) => a.propriedadeId === propId) : animais;
  const lotesFiltrados = propId ? lotes.filter((l) => l.propriedadeId === propId) : lotes;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manejo Sanitário</h1>
        <button
          onClick={() => {
            setForm({ ...emptyForm, propriedadeId: propId, data: new Date().toISOString().slice(0, 10) });
            setEditId(null);
            setFormOpen(true);
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Novo registro
        </button>
      </div>

      {formOpen && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">{editId ? 'Editar registro' : 'Novo registro de manejo sanitário'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Fazenda</label>
              <select
                value={form.propriedadeId || propId}
                onChange={(e) => setForm({ ...form, propriedadeId: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              >
                <option value="">Selecione</option>
                {propriedades.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Animal</label>
              <select
                value={form.animalId}
                onChange={(e) => setForm({ ...form, animalId: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              >
                <option value="">Selecione</option>
                {animaisFiltrados.map((a) => (
                  <option key={a.id} value={a.id}>Brinco {a.brinco}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Lote</label>
              <select
                value={form.loteId}
                onChange={(e) => setForm({ ...form, loteId: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              >
                <option value="">Selecione</option>
                {lotesFiltrados.map((l) => (
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
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
              <span className="block text-sm font-medium text-gray-700 mb-2">Tipo, forma e via</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tipo do Manejo</label>
              <select
                value={form.tipoManejo}
                onChange={(e) => {
                  const novoTipo = e.target.value;
                  const formasDoTipo = novoTipo ? (TIPO_MANEJO_FORMAS[novoTipo] ?? []) : [];
                  const formaValida = form.formaFarmaceutica && formasDoTipo.includes(form.formaFarmaceutica);
                  const viasDaForma = novoTipo && formaValida ? (TIPO_FORMA_VIAS[novoTipo]?.[form.formaFarmaceutica] ?? []).map((v) => v.value) : [];
                  const viaValida = form.viaAdministracao && viasDaForma.includes(form.viaAdministracao);
                  setForm({ ...form, tipoManejo: novoTipo, formaFarmaceutica: formaValida ? form.formaFarmaceutica : '', viaAdministracao: viaValida ? form.viaAdministracao : '' });
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              >
                <option value="">Selecione</option>
                {TIPOS_MANEJO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Forma Farmacêutica</label>
              <select
                value={form.formaFarmaceutica}
                onChange={(e) => {
                  const novaForma = e.target.value;
                  const viasDisponiveis = novaForma && form.tipoManejo ? (TIPO_FORMA_VIAS[form.tipoManejo]?.[novaForma] ?? []).map((v) => v.value) : [];
                  const viaValida = form.viaAdministracao && viasDisponiveis.includes(form.viaAdministracao);
                  setForm({ ...form, formaFarmaceutica: novaForma, viaAdministracao: viaValida ? form.viaAdministracao : '' });
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                disabled={!form.tipoManejo}
                title={!form.tipoManejo ? 'Selecione o Tipo do Manejo primeiro' : ''}
              >
                <option value="">{form.tipoManejo ? 'Selecione' : 'Selecione o tipo de manejo antes'}</option>
                {(form.tipoManejo
                  ? [...new Set([...(TIPO_MANEJO_FORMAS[form.tipoManejo] ?? []), ...(form.formaFarmaceutica && !(TIPO_MANEJO_FORMAS[form.tipoManejo] ?? []).includes(form.formaFarmaceutica) ? [form.formaFarmaceutica] : [])])]
                  : []
                ).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Via de Aplicação</label>
              <select
                value={form.viaAdministracao}
                onChange={(e) => setForm({ ...form, viaAdministracao: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                disabled={!form.formaFarmaceutica}
                title={!form.formaFarmaceutica ? 'Selecione a Forma Farmacêutica primeiro' : ''}
              >
                <option value="">
                  {form.formaFarmaceutica ? 'Selecione' : 'Selecione a forma farmacêutica antes'}
                </option>
                {(form.formaFarmaceutica && form.tipoManejo
                  ? [
                      ...(TIPO_FORMA_VIAS[form.tipoManejo]?.[form.formaFarmaceutica] ?? []),
                      ...(form.viaAdministracao &&
                      !(TIPO_FORMA_VIAS[form.tipoManejo]?.[form.formaFarmaceutica] ?? []).some((v) => v.value === form.viaAdministracao)
                        ? [{ value: form.viaAdministracao, label: form.viaAdministracao }]
                        : []),
                    ]
                  : []
                ).map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Responsável pela Prescrição</label>
              <input
                type="text"
                value={form.responsavelPrescricao}
                onChange={(e) => setForm({ ...form, responsavelPrescricao: e.target.value })}
                placeholder="Nome do responsável"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Responsável pela Aplicação</label>
              <input
                type="text"
                value={form.responsavelAplicacao}
                onChange={(e) => setForm({ ...form, responsavelAplicacao: e.target.value })}
                placeholder="Nome do aplicador"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Medicamento</label>
              <input
                type="text"
                value={form.medicamento}
                onChange={(e) => setForm({ ...form, medicamento: e.target.value })}
                placeholder="Nome do medicamento"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div>
              <ImageCapture
                value={form.fotoProduto}
                onChange={(url) => setForm({ ...form, fotoProduto: url })}
                label="Foto do Produto"
              />
            </div>
            <div>
              <ImageCapture
                value={form.fotoReceita}
                onChange={(url) => setForm({ ...form, fotoReceita: url })}
                label="Foto da Receita"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Dosagem/Posologia</label>
              <input
                type="text"
                value={form.dosagemPosologia}
                onChange={(e) => setForm({ ...form, dosagemPosologia: e.target.value })}
                placeholder="Dosagem e posologia"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Frequência e Duração</label>
              <input
                type="text"
                value={form.frequenciaDuracao}
                onChange={(e) => setForm({ ...form, frequenciaDuracao: e.target.value })}
                placeholder="Ex: 1x/dia por 5 dias"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Carência</label>
              <input
                type="text"
                value={form.carencia}
                onChange={(e) => setForm({ ...form, carencia: e.target.value })}
                placeholder="Período de carência"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
              <textarea
                value={form.observacao}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                placeholder="Observações adicionais"
                rows={2}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={salvar} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Salvar</button>
            <button onClick={cancelar} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">Filtrar por fazenda</label>
        <select
          value={propId}
          onChange={(e) => setPropId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-64"
        >
          <option value="">Todas</option>
          {propriedades.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Carregando...</p>
        ) : manejos.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Nenhum registro de manejo sanitário</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Fazenda</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Brinco</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Lote</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Medicamento</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Dosagem</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Carência</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {manejos.map((m) => (
                  <tr key={m.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">{m.propriedade?.nome ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">{m.animal?.brinco ?? '—'}</td>
                    <td className="px-4 py-3">{m.lote?.nome ?? '—'}</td>
                    <td className="px-4 py-3">{m.tipoManejo ?? '—'}</td>
                    <td className="px-4 py-3">{m.medicamento ?? '—'}</td>
                    <td className="px-4 py-3 max-w-xs truncate" title={m.dosagemPosologia}>{m.dosagemPosologia ?? '—'}</td>
                    <td className="px-4 py-3">{m.carencia ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => abrirEdicao(m)} className="text-primary-600 hover:underline mr-3">Editar</button>
                      <button type="button" onClick={() => excluir(m)} className="text-red-600 hover:underline">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
