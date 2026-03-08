import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function Sanidade() {
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [vacinacoes, setVacinacoes] = useState<any[]>([]);
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [animais, setAnimais] = useState<any[]>([]);
  const [propId, setPropId] = useState('');
  const [formMed, setFormMed] = useState(false);
  const [formVac, setFormVac] = useState(false);
  const [editMedId, setEditMedId] = useState<string | null>(null);
  const [novoMed, setNovoMed] = useState({ nome: '', tipo: 'vacina', estoque: '0', estoqueMinimo: '' });
  const [novaVac, setNovaVac] = useState({ animalId: '', medicamentoId: '', data: new Date().toISOString().slice(0, 10) });
  const [editVacId, setEditVacId] = useState<string | null>(null);

  const load = () => {
    api.get('/propriedades').then((p: any) => { setPropriedades(p); if (p[0]) setPropId(p[0].id); });
    api.get<any[]>('/sanidade/medicamentos').then((r) => setMedicamentos(r ?? []));
    api.get<any[]>('/sanidade/vacinacoes').then((r) => setVacinacoes(r ?? []));
    api.get<any[]>('/animais').then((r) => setAnimais(r ?? []));
  };
  useEffect(load, []);

  const abrirEdicaoMed = (m: any) => {
    setEditMedId(m.id);
    setNovoMed({
      nome: m.nome,
      tipo: m.tipo ?? 'vacina',
      estoque: String(m.estoque ?? 0),
      estoqueMinimo: m.estoqueMinimo != null ? String(m.estoqueMinimo) : '',
    });
    setFormMed(true);
  };

  const cancelarMed = () => {
    setFormMed(false);
    setEditMedId(null);
    setNovoMed({ nome: '', tipo: 'vacina', estoque: '0', estoqueMinimo: '' });
  };

  const salvarMed = async () => {
    const payload = { ...novoMed, propriedadeId: propId, estoque: Number(novoMed.estoque), estoqueMinimo: novoMed.estoqueMinimo ? Number(novoMed.estoqueMinimo) : undefined };
    if (editMedId) {
      await api.patch(`/sanidade/medicamentos/${editMedId}`, payload);
    } else {
      await api.post('/sanidade/medicamentos', payload);
    }
    cancelarMed();
    load();
  };

  const excluirMed = async (m: any) => {
    if (!window.confirm(`Excluir medicamento ${m.nome}?`)) return;
    await api.delete(`/sanidade/medicamentos/${m.id}`);
    load();
  };
  const salvarVac = async () => {
    const payload = { ...novaVac, data: new Date(novaVac.data).toISOString() };
    if (editVacId) {
      await api.patch(`/sanidade/vacinacoes/${editVacId}`, payload);
      setEditVacId(null);
    } else {
      await api.post('/sanidade/vacinacoes', payload);
    }
    setFormVac(false);
    setNovaVac({ animalId: '', medicamentoId: '', data: new Date().toISOString().slice(0, 10) });
    load();
  };

  const medsProp = propId ? medicamentos.filter((m) => m.propriedadeId === propId) : medicamentos;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sanidade</h1>
      <select value={propId} onChange={(e) => setPropId(e.target.value)} className="mb-4 border rounded px-3 py-2">{propriedades.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Medicamentos</h2>
            <button onClick={() => setFormMed(true)} className="text-sm text-primary-600">+ Novo</button>
          </div>
          {formMed && (
            <div className="mb-4 p-3 bg-gray-50 rounded space-y-2">
              <input placeholder="Nome" value={novoMed.nome} onChange={(e) => setNovoMed({ ...novoMed, nome: e.target.value })} className="border rounded px-2 py-1 w-full" />
              <select value={novoMed.tipo} onChange={(e) => setNovoMed({ ...novoMed, tipo: e.target.value })} className="border rounded px-2 py-1 w-full"><option value="vacina">Vacina</option><option value="medicamento">Medicamento</option><option value="antiparasitario">Antiparasitário</option></select>
              <input type="number" placeholder="Estoque" value={novoMed.estoque} onChange={(e) => setNovoMed({ ...novoMed, estoque: e.target.value })} className="border rounded px-2 py-1 w-full" />
              <div className="flex gap-2"><button onClick={salvarMed} className="px-3 py-1 bg-primary-600 text-white rounded text-sm">Salvar</button><button onClick={cancelarMed} className="px-3 py-1 border rounded text-sm">Cancelar</button></div>
            </div>
          )}
          {medsProp.length === 0 ? <p className="text-gray-500 text-sm">Nenhum medicamento</p> : (
            <ul className="space-y-2">{medsProp.map((m) => <li key={m.id} className="flex justify-between items-center">
              <span>{m.nome}</span>
              <span className="flex items-center gap-2">
                <span className={m.estoqueMinimo != null && m.estoque <= m.estoqueMinimo ? 'text-red-600' : ''}>{m.estoque} {m.tipo}</span>
                <button type="button" onClick={() => abrirEdicaoMed(m)} className="text-primary-600 hover:underline text-sm">Editar</button>
                <button type="button" onClick={() => excluirMed(m)} className="text-red-600 hover:underline text-sm">Excluir</button>
              </span>
            </li>)}</ul>
          )}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Vacinações</h2>
            <button onClick={() => { setEditVacId(null); setFormVac(true); }} className="text-sm text-primary-600">+ Registrar</button>
          </div>
          {formVac && (
            <div className="mb-4 p-3 bg-gray-50 rounded space-y-2">
              <select value={novaVac.animalId} onChange={(e) => setNovaVac({ ...novaVac, animalId: e.target.value })} className="border rounded px-2 py-1 w-full"><option value="">Animal</option>{animais.map((a) => <option key={a.id} value={a.id}>Brinco {a.brinco}</option>)}</select>
              <select value={novaVac.medicamentoId} onChange={(e) => setNovaVac({ ...novaVac, medicamentoId: e.target.value })} className="border rounded px-2 py-1 w-full"><option value="">Medicamento</option>{medicamentos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select>
              <input type="date" value={novaVac.data} onChange={(e) => setNovaVac({ ...novaVac, data: e.target.value })} className="border rounded px-2 py-1 w-full" />
              <div className="flex gap-2"><button onClick={salvarVac} className="px-3 py-1 bg-primary-600 text-white rounded text-sm">Salvar</button><button onClick={() => { setFormVac(false); setEditVacId(null); }} className="px-3 py-1 border rounded text-sm">Cancelar</button></div>
            </div>
          )}
          {vacinacoes.length === 0 ? <p className="text-gray-500 text-sm">Nenhuma vacinação</p> : (
            <ul className="space-y-2">{vacinacoes.slice(0, 20).map((v) => <li key={v.id} className="flex justify-between items-center text-sm"><span>Brinco {v.animal?.brinco} — {v.medicamento?.nome} — {new Date(v.data).toLocaleDateString('pt-BR')}</span><span className="flex gap-2"><button type="button" onClick={() => { setEditVacId(v.id); setNovaVac({ animalId: v.animalId, medicamentoId: v.medicamentoId, data: new Date(v.data).toISOString().slice(0, 10) }); setFormVac(true); }} className="text-primary-600 hover:underline">Editar</button><button type="button" onClick={async () => { if (!window.confirm('Excluir vacinação?')) return; await api.delete(`/sanidade/vacinacoes/${v.id}`); load(); }} className="text-red-600 hover:underline">Excluir</button></span></li>)}</ul>
          )}
        </div>
      </div>
    </div>
  );
}
