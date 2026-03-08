import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus } from 'lucide-react';
import { MapaPiquete, type PoligonoGeoJSON } from '../../components/MapaPiquete';

/** UA/ha (Unidades Animal por hectare) de referência por espécie forrageira - pastagens bem manejadas no Cerrado/Brasil */
const uaPorHaPorEspecie: Record<string, number> = {
  'Brachiaria brizantha cv. Marandu': 2.8,
  'Brachiaria brizantha cv. Xaraés': 3.0,
  'Brachiaria brizantha cv. Piatã': 2.8,
  'Brachiaria cv. Camello': 2.5,
  'Brachiaria decumbens': 2.2,
  'Brachiaria humidicola': 2.0,
  'Brachiaria ruziziensis': 2.5,
  'Panicum maximum cv. Mombaça': 3.2,
  'Panicum maximum cv. Tanzânia': 3.0,
  'Panicum maximum cv. Massai': 2.8,
  'Panicum maximum cv. Aruana': 2.5,
  'Panicum maximum cv. Myagui': 2.8,
  'Panicum maximum cv. Paredão MG12': 3.0,
  'Cynodon (Tifton, Coast Cross)': 4.0,
  'Cynodon nlemfuensis (Estrela)': 3.5,
  'Pennisetum purpureum (Capim-elefante)': 3.5,
  'Paspalum notatum (Grama-batatais)': 2.0,
  'Andropogon gayanus (Capim-andropogon)': 2.2,
  'Buffel (Cenchrus ciliaris)': 2.5,
  'Amendoim-forrageiro (Arachis pintoi)': 3.0,
  'Estilosantes (Stylosanthes)': 2.5,
  'Alfafa (Medicago sativa)': 4.0,
  'Outras': 2.0,
};

const fatorEstadoConservacao: Record<string, number> = {
  BOM: 1.0,
  REGULAR: 0.75,
  DEGRADADO: 0.5,
  EM_REFORMA: 0.3,
};

const fatorAdubado = 1.2;   // +20% com adubação
const fatorIrrigado = 1.5;  // +50% com irrigação
const fatorSistemaPastejo: Record<string, number> = {
  ROTACIONADO: 1.2,   // +20% - pastejo rotacionado
  CONTINUO: 0.8,      // -20% - pastejo contínuo reduz capacidade
  VOISIN: 1.3,        // +30% - pastoreio racional Voisin (alta eficiência)
  FAIXA: 1.25,        // +25% - pastejo em faixa (strip grazing)
};
const labelSistemaPastejo: Record<string, string> = {
  CONTINUO: 'Cont.',
  ROTACIONADO: 'Rotac.',
  VOISIN: 'Voisin',
  FAIXA: 'Faixa',
};

/** Calcula capacidade de suporte total (UA) = área × UA/ha × fator conservação × fator adubação × fator irrigação × fator sistema pastejo */
function calcularCapacidadeSuporte(
  especieForrageira: string,
  areaHa: number,
  estadoConservacao?: string,
  adubado?: boolean,
  irrigado?: boolean,
  sistemaPastejo?: string,
): number | null {
  if (!especieForrageira || !areaHa || areaHa <= 0) return null;
  const uaHa = uaPorHaPorEspecie[especieForrageira] ?? uaPorHaPorEspecie['Outras'];
  const fatorConservacao = estadoConservacao ? (fatorEstadoConservacao[estadoConservacao] ?? 1) : 1;
  const fatorAdub = adubado ? fatorAdubado : 1;
  const fatorIrr = irrigado ? fatorIrrigado : 1;
  const fatorSistema = sistemaPastejo ? (fatorSistemaPastejo[sistemaPastejo] ?? 1) : 1;
  return Math.round(uaHa * fatorConservacao * fatorAdub * fatorIrr * fatorSistema * areaHa * 100) / 100;
}

const gruposForrageiras: { label: string; opcoes: string[] }[] = [
  {
    label: 'Brachiaria (Braquiária)',
    opcoes: [
      'Brachiaria brizantha cv. Marandu',
      'Brachiaria brizantha cv. Xaraés',
      'Brachiaria brizantha cv. Piatã',
      'Brachiaria cv. Camello',
      'Brachiaria decumbens',
      'Brachiaria humidicola',
      'Brachiaria ruziziensis',
    ],
  },
  {
    label: 'Panicum (Panico)',
    opcoes: [
      'Panicum maximum cv. Mombaça',
      'Panicum maximum cv. Tanzânia',
      'Panicum maximum cv. Massai',
      'Panicum maximum cv. Aruana',
      'Panicum maximum cv. Myagui',
      'Panicum maximum cv. Paredão MG12',
    ],
  },
  {
    label: 'Outras gramíneas',
    opcoes: [
      'Cynodon (Tifton, Coast Cross)',
      'Cynodon nlemfuensis (Estrela)',
      'Pennisetum purpureum (Capim-elefante)',
      'Paspalum notatum (Grama-batatais)',
      'Andropogon gayanus (Capim-andropogon)',
      'Buffel (Cenchrus ciliaris)',
    ],
  },
  {
    label: 'Leguminosas',
    opcoes: [
      'Amendoim-forrageiro (Arachis pintoi)',
      'Estilosantes (Stylosanthes)',
      'Alfafa (Medicago sativa)',
    ],
  },
  { label: 'Outras', opcoes: ['Outras'] },
];

export default function PiquetesList() {
  const [piquetes, setPiquetes] = useState<any[]>([]);
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [propId, setPropId] = useState('');
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [novo, setNovo] = useState<{
    nome: string;
    areaHa: string;
    especieForrageira: string;
    capacidadeSuporte: string;
    estadoConservacao: string;
    bebedouro: boolean;
    cochoParaSal: boolean;
    adubado: boolean;
    irrigado: boolean;
    sistemaPastejo: string;
    poligono: PoligonoGeoJSON | null;
  }>({ nome: '', areaHa: '', especieForrageira: '', capacidadeSuporte: '', estadoConservacao: '', bebedouro: false, cochoParaSal: false, adubado: false, irrigado: false, sistemaPastejo: '', poligono: null });

  useEffect(() => { api.get('/propriedades').then((p: any) => { setPropriedades(p); if (p[0]) setPropId(p[0].id); }); }, []);
  useEffect(() => { if (propId) api.get<any[]>(`/piquetes?propriedadeId=${propId}`).then((r) => setPiquetes(r ?? [])); }, [propId]);

  const capacidadeSuporteCalculada = calcularCapacidadeSuporte(
    novo.especieForrageira,
    Number(novo.areaHa) || 0,
    novo.estadoConservacao || undefined,
    novo.adubado,
    novo.irrigado,
    novo.sistemaPastejo || undefined,
  );

  useEffect(() => {
    setNovo((prev) => ({
      ...prev,
      capacidadeSuporte: capacidadeSuporteCalculada != null ? String(capacidadeSuporteCalculada) : '',
    }));
  }, [capacidadeSuporteCalculada]);

  const abrirEdicao = (q: any) => {
    setEditId(q.id);
    setNovo({
      nome: q.nome,
      areaHa: String(q.areaHa ?? ''),
      especieForrageira: q.especieForrageira ?? '',
      capacidadeSuporte: String(q.capacidadeSuporte ?? ''),
      estadoConservacao: q.estadoConservacao ?? '',
      bebedouro: q.bebedouro ?? false,
      cochoParaSal: q.cochoParaSal ?? false,
      adubado: q.adubado ?? false,
      irrigado: q.irrigado ?? false,
      sistemaPastejo: q.sistemaPastejo ?? '',
      poligono: q.poligono ?? null,
    });
    setForm(true);
  };

  const cancelar = () => {
    setForm(false);
    setEditId(null);
    setNovo({ nome: '', areaHa: '', especieForrageira: '', capacidadeSuporte: '', estadoConservacao: '', bebedouro: false, cochoParaSal: false, adubado: false, irrigado: false, sistemaPastejo: '', poligono: null });
  };

  const salvar = async () => {
    if (!novo.nome?.trim()) { alert('Nome é obrigatório.'); return; }
    const areaNum = Number(novo.areaHa);
    if (!novo.areaHa || isNaN(areaNum) || areaNum <= 0) { alert('Área (ha) é obrigatória e deve ser maior que zero.'); return; }
    if (!novo.especieForrageira) { alert('Espécie forrageira é obrigatória.'); return; }
    if (!novo.estadoConservacao) { alert('Estado de conservação é obrigatório.'); return; }
    if (!novo.sistemaPastejo) { alert('Sistema de pastejo é obrigatório.'); return; }
    if (!novo.poligono) { alert('Perímetro geoespacial (polígono) é obrigatório. Desenhe o contorno do piquete no mapa.'); return; }
    const payload: any = { ...novo, propriedadeId: propId, areaHa: Number(novo.areaHa), especieForrageira: novo.especieForrageira, capacidadeSuporte: novo.capacidadeSuporte ? Number(novo.capacidadeSuporte) : undefined };
    if (novo.estadoConservacao) payload.estadoConservacao = novo.estadoConservacao;
    payload.bebedouro = novo.bebedouro;
    payload.cochoParaSal = novo.cochoParaSal;
    payload.adubado = novo.adubado;
    payload.irrigado = novo.irrigado;
    if (novo.sistemaPastejo) payload.sistemaPastejo = novo.sistemaPastejo;
    if (novo.poligono) payload.poligono = novo.poligono;
    if (editId) {
      await api.patch(`/piquetes/${editId}`, payload);
    } else {
      await api.post('/piquetes', payload);
    }
    const lista = await api.get<any[]>(`/piquetes?propriedadeId=${propId}`);
    setPiquetes(lista ?? []);
    cancelar();
  };

  const excluir = async (q: any) => {
    if (!window.confirm(`Excluir piquete ${q.nome}?`)) return;
    await api.delete(`/piquetes/${q.id}`);
    setPiquetes((prev) => prev.filter((x) => x.id !== q.id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Piquetes</h1>
      <div className="flex gap-4 mb-4">
        <select value={propId} onChange={(e) => setPropId(e.target.value)} className="border rounded px-3 py-2">{propriedades.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
        <button onClick={() => setForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg"><Plus size={18} /> Novo piquete</button>
      </div>

      {form && (
        <div className="bg-white p-6 rounded-xl shadow mb-6 max-w-3xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nome *" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} className="border rounded-lg px-3 py-2 w-full" required />
            <input type="number" step="0.01" placeholder="Área (ha) * — preenchido automaticamente ao desenhar o perímetro" value={novo.areaHa} onChange={(e) => setNovo({ ...novo, areaHa: e.target.value })} className="border rounded-lg px-3 py-2 w-full bg-gray-50" required title={novo.poligono ? 'Calculada automaticamente pelo polígono. Pode editar manualmente se necessário.' : undefined} />
            <input placeholder="Capacidade suporte (UA) — calculada automaticamente" value={novo.capacidadeSuporte} readOnly type="number" step="0.01" className="border rounded-lg px-3 py-2 w-full bg-gray-100 cursor-not-allowed" title="Calculada a partir da espécie forrageira, área, conservação, adubação, irrigação e sistema de pastejo" />
            <select value={novo.especieForrageira} onChange={(e) => setNovo({ ...novo, especieForrageira: e.target.value })} className="border rounded-lg px-3 py-2 w-full" required>
              <option value="">Espécie forrageira *</option>
              {gruposForrageiras.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.opcoes.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select value={novo.estadoConservacao} onChange={(e) => setNovo({ ...novo, estadoConservacao: e.target.value })} className="border rounded-lg px-3 py-2 w-full" required>
              <option value="">Estado de conservação *</option>
              <option value="BOM">Bom</option>
              <option value="REGULAR">Regular</option>
              <option value="DEGRADADO">Degradado</option>
              <option value="EM_REFORMA">Em reforma</option>
            </select>
            <select value={novo.sistemaPastejo} onChange={(e) => setNovo({ ...novo, sistemaPastejo: e.target.value })} className="border rounded-lg px-3 py-2 w-full" required>
              <option value="">Sistema de pastejo *</option>
              <option value="CONTINUO">Contínuo</option>
              <option value="ROTACIONADO">Rotacionado</option>
              <option value="FAIXA">Faixa</option>
              <option value="VOISIN">Voisin</option>
            </select>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={novo.bebedouro} onChange={(e) => setNovo({ ...novo, bebedouro: e.target.checked })} className="rounded" />
                <span className="text-sm">Bebedouro *</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={novo.cochoParaSal} onChange={(e) => setNovo({ ...novo, cochoParaSal: e.target.checked })} className="rounded" />
                <span className="text-sm">Cocho para Sal *</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={novo.adubado} onChange={(e) => setNovo({ ...novo, adubado: e.target.checked })} className="rounded" />
                <span className="text-sm">Adubado *</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={novo.irrigado} onChange={(e) => setNovo({ ...novo, irrigado: e.target.checked })} className="rounded" />
                <span className="text-sm">Irrigado *</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Perímetro geoespacial (poligonal) *</label>
            <p className="text-xs text-gray-500 mb-2">Desenhe o contorno do piquete no mapa de satélite. Use o ícone de polígono na barra superior. Obrigatório.</p>
            <MapaPiquete value={novo.poligono} onChange={(p, areaHa) => setNovo({ ...novo, poligono: p, ...(areaHa !== undefined && { areaHa: String(areaHa) }) })} />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={salvar} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Salvar
            </button>
            <button type="button" onClick={cancelar} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full"><thead className="bg-gray-50"><tr><th className="text-left p-3">Nome</th><th className="text-left p-3">Área (ha)</th><th className="text-left p-3">Forrageira</th><th className="text-left p-3">Cap. suporte</th><th className="text-left p-3">Estado</th><th className="text-left p-3">Pastejo</th><th className="text-left p-3">Adubado</th><th className="text-left p-3">Irrigado</th><th className="text-left p-3">Bebedouro</th><th className="text-left p-3">Cocho Sal</th><th className="text-left p-3">Polígono</th><th className="text-right p-3">Ações</th></tr></thead><tbody>{piquetes.map((q) => <tr key={q.id} className="border-t"><td className="p-3 font-medium">{q.nome}</td><td className="p-3">{q.areaHa}</td><td className="p-3">{q.especieForrageira || '—'}</td><td className="p-3">{q.capacidadeSuporte ?? '—'}</td><td className="p-3">{q.estadoConservacao || '—'}</td><td className="p-3">{q.sistemaPastejo ? (labelSistemaPastejo[q.sistemaPastejo] ?? q.sistemaPastejo) : '—'}</td><td className="p-3">{q.adubado ? 'Sim' : 'Não'}</td><td className="p-3">{q.irrigado ? 'Sim' : 'Não'}</td><td className="p-3">{q.bebedouro ? 'Sim' : 'Não'}</td><td className="p-3">{q.cochoParaSal ? 'Sim' : 'Não'}</td><td className="p-3">{q.poligono ? 'Sim' : 'Não'}</td><td className="p-3 text-right"><button type="button" onClick={() => abrirEdicao(q)} className="text-primary-600 hover:underline mr-2">Editar</button><button type="button" onClick={() => excluir(q)} className="text-red-600 hover:underline">Excluir</button></td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
