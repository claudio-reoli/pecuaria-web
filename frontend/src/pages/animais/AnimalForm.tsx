import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';

const categorias = ['BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI'];

const grausSangue = ['PO', 'PC', 'LA', '15/16', '7/8', '3/4', '1/2', 'Mestiço', 'Sem registro'];

const statusRegistroList = ['RGN', 'RGD', 'sem registro'];

// Número do registro: obrigatório quando status é RGN ou RGD; oculto quando "sem registro"
const statusComRegistro = (s: string) => s === 'RGN' || s === 'RGD';

export default function AnimalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [propriedades, setPropriedades] = useState<{ id: string; nome: string }[]>([]);
  const [lotes, setLotes] = useState<{ id: string; nome: string; propriedadeId: string }[]>([]);
  const [racas, setRacas] = useState<{ id: string; nome: string }[]>([]);
  const [animais, setAnimais] = useState<{ id: string; brinco: string; apelido?: string; sexo: string }[]>([]);
  const [piquetes, setPiquetes] = useState<{ id: string; nome: string }[]>([]);
  const [form, setForm] = useState({
    propriedadeId: '',
    brinco: '',
    brincoEid: '',
    apelido: '',
    especie: 'bovino',
    raca: '',
    grauSangue: '',
    sexo: 'M',
    categoria: 'BEZERRO',
    dataNascimento: '',
    pesoAoNascer: '',
    pelagem: '',
    origem: '',
    tipoOrigem: '',
    dataEntrada: '',
    paiId: '',
    maeId: '',
    nomePai: '',
    nomeMae: '',
    statusRegistro: '',
    numeroRegistro: '',
    loteId: '',
    piqueteId: '',
    propriedadeOrigem: '',
    valorAquisicao: '',
    numeroSISBOV: '',
    observacoes: '',
    ativo: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ id: string; nome: string }[]>('/propriedades').then((r) => setPropriedades(r ?? []));
    api.get<{ id: string; nome: string }[]>('/racas').then((r) => setRacas(r ?? []));
  }, []);

  useEffect(() => {
    if (form.propriedadeId) {
      api.get<{ id: string; nome: string; propriedadeId: string }[]>(`/lotes?propriedadeId=${form.propriedadeId}`).then((r) => setLotes(r ?? []));
      api.get<{ id: string; brinco: string; apelido?: string; sexo: string }[]>(`/animais?propriedadeId=${form.propriedadeId}`).then((r) => setAnimais(r ?? []));
      api.get<{ id: string; nome: string }[]>(`/piquetes?propriedadeId=${form.propriedadeId}`).then((r) => setPiquetes(r ?? []));
    } else {
      setLotes([]);
      setAnimais([]);
      setPiquetes([]);
    }
  }, [form.propriedadeId]);

  useEffect(() => {
    if (id && id !== 'novo') {
      api.get<any>(`/animais/${id}`).then((a) => {
        setForm({
          propriedadeId: a.propriedadeId,
          brinco: a.brinco,
          brincoEid: a.brincoEid || '',
          apelido: a.apelido || '',
          especie: a.especie,
          raca: a.raca || '',
          grauSangue: a.grauSangue || '',
          sexo: a.sexo,
          categoria: a.categoria,
          dataNascimento: a.dataNascimento ? a.dataNascimento.slice(0, 10) : '',
          pesoAoNascer: a.pesoAoNascer?.toString() || '',
          pelagem: a.pelagem || '',
          origem: a.origem || '',
          tipoOrigem: a.tipoOrigem || '',
          dataEntrada: a.dataEntrada ? a.dataEntrada.slice(0, 10) : '',
          paiId: a.paiId || '',
          maeId: a.maeId || '',
          nomePai: a.nomePai || '',
          nomeMae: a.nomeMae || '',
          statusRegistro: a.statusRegistro || '',
          numeroRegistro: a.numeroRegistro || '',
          loteId: a.loteId || '',
          piqueteId: a.piqueteId || '',
          propriedadeOrigem: a.propriedadeOrigem || '',
          valorAquisicao: a.valorAquisicao?.toString() || '',
          numeroSISBOV: a.numeroSISBOV || '',
          observacoes: a.observacoes || '',
          ativo: a.ativo !== false,
        });
      });
    } else if (propriedades[0]) {
      setForm((f) => ({ ...f, propriedadeId: propriedades[0].id }));
    }
  }, [id, propriedades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tipoOrigem) {
      alert('Origem é obrigatória.');
      return;
    }
    if (!form.apelido?.trim()) {
      alert('Apelido é obrigatório.');
      return;
    }
    if (!form.raca) {
      alert('Raça é obrigatória.');
      return;
    }
    if (!form.grauSangue) {
      alert('Grau de sangue é obrigatório.');
      return;
    }
    if (!form.dataNascimento) {
      alert('Data de nascimento é obrigatória.');
      return;
    }
    if (!form.loteId) {
      alert('Lote é obrigatório.');
      return;
    }
    if (statusComRegistro(form.statusRegistro) && !form.numeroRegistro?.trim()) {
      alert('Número do registro é obrigatório quando o status é RGN ou RGD.');
      return;
    }
    if (form.numeroSISBOV?.trim() && !/^\d{15}$/.test(form.numeroSISBOV.trim())) {
      alert('O número SISBOV deve conter exatamente 15 dígitos numéricos.');
      return;
    }
    if (['COMPRA', 'TRANSFERENCIA'].includes(form.tipoOrigem) && !form.dataEntrada) {
      alert('Data da entrada é obrigatória quando a origem é Compra ou Transferência.');
      return;
    }
    if (form.tipoOrigem === 'NASCIMENTO' && (!form.paiId || !form.maeId)) {
      alert('Pai e mãe são obrigatórios para animais de nascimento na fazenda.');
      return;
    }
    if (['COMPRA', 'TRANSFERENCIA'].includes(form.tipoOrigem) && (!form.nomePai?.trim() || !form.nomeMae?.trim())) {
      alert('Nome do pai e da mãe são obrigatórios para Compra ou Transferência.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        propriedadeId: form.propriedadeId || undefined,
        pesoAoNascer: form.pesoAoNascer ? Number(form.pesoAoNascer) : undefined,
        tipoOrigem: form.tipoOrigem || undefined,
        dataEntrada: ['COMPRA', 'TRANSFERENCIA'].includes(form.tipoOrigem) && form.dataEntrada ? form.dataEntrada : undefined,
        paiId: form.tipoOrigem === 'NASCIMENTO' ? form.paiId || undefined : null,
        maeId: form.tipoOrigem === 'NASCIMENTO' ? form.maeId || undefined : null,
        nomePai: ['COMPRA', 'TRANSFERENCIA'].includes(form.tipoOrigem) ? form.nomePai?.trim() || undefined : null,
        nomeMae: ['COMPRA', 'TRANSFERENCIA'].includes(form.tipoOrigem) ? form.nomeMae?.trim() || undefined : null,
        propriedadeOrigem: ['COMPRA', 'TRANSFERENCIA'].includes(form.tipoOrigem) ? form.propriedadeOrigem?.trim() || undefined : null,
        valorAquisicao: form.tipoOrigem === 'COMPRA' && form.valorAquisicao ? Number(form.valorAquisicao) : undefined,
        numeroSISBOV: form.numeroSISBOV?.trim() || undefined,
        observacoes: form.observacoes?.trim() || undefined,
        ativo: form.ativo,
        piqueteId: form.piqueteId || undefined,
        statusRegistro: form.statusRegistro || undefined,
        numeroRegistro: statusComRegistro(form.statusRegistro) ? form.numeroRegistro?.trim() || undefined : null,
        loteId: form.loteId || undefined,
      };
      if (id && id !== 'novo') {
        await api.patch(`/animais/${id}`, payload);
      } else {
        await api.post('/animais', payload);
      }
      navigate('/animais');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {id && id !== 'novo' ? 'Editar animal' : 'Novo animal'}
      </h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 bg-white p-6 rounded-xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Propriedade *</label>
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
            <label className="block text-sm font-medium mb-1">Brinco *</label>
            <input
              value={form.brinco}
              onChange={(e) => setForm({ ...form, brinco: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apelido *</label>
            <input
              value={form.apelido}
              onChange={(e) => setForm({ ...form, apelido: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sexo *</label>
            <select
              value={form.sexo}
              onChange={(e) => setForm({ ...form, sexo: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="M">Macho</option>
              <option value="F">Fêmea</option>
              <option value="M_CASTRADO">Macho castrado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria *</label>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Raça *</label>
            <select
              value={form.raca}
              onChange={(e) => setForm({ ...form, raca: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Selecione</option>
              {racas.map((r) => (
                <option key={r.id} value={r.nome}>{r.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Grau de sangue *</label>
            <select
              value={form.grauSangue}
              onChange={(e) => setForm({ ...form, grauSangue: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Selecione</option>
              {grausSangue.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status do registro</label>
            <select
              value={form.statusRegistro}
              onChange={(e) => {
                const v = e.target.value;
                setForm({
                  ...form,
                  statusRegistro: v,
                  numeroRegistro: v === 'sem registro' ? '' : form.numeroRegistro,
                });
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Selecione</option>
              {statusRegistroList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {statusComRegistro(form.statusRegistro) && (
            <div>
              <label className="block text-sm font-medium mb-1">Número do registro *</label>
              <input
                value={form.numeroRegistro}
                onChange={(e) => setForm({ ...form, numeroRegistro: e.target.value })}
                placeholder="Número do registro genealógico"
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Origem *</label>
            <select
              value={form.tipoOrigem}
              onChange={(e) => {
                const v = e.target.value;
                setForm({
                  ...form,
                  tipoOrigem: v,
                  dataEntrada: ['COMPRA', 'TRANSFERENCIA'].includes(v) ? form.dataEntrada : '',
                  paiId: v === 'NASCIMENTO' ? form.paiId : '',
                  maeId: v === 'NASCIMENTO' ? form.maeId : '',
                  nomePai: ['COMPRA', 'TRANSFERENCIA'].includes(v) ? form.nomePai : '',
                  nomeMae: ['COMPRA', 'TRANSFERENCIA'].includes(v) ? form.nomeMae : '',
                });
              }}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Selecione</option>
              <option value="NASCIMENTO">Nascimento</option>
              <option value="COMPRA">Compra</option>
              <option value="TRANSFERENCIA">Transferência</option>
            </select>
          </div>
          {form.tipoOrigem === 'NASCIMENTO' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Pai (animal da fazenda) *</label>
                <select
                  value={form.paiId}
                  onChange={(e) => setForm({ ...form, paiId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required={form.tipoOrigem === 'NASCIMENTO'}
                >
                  <option value="">Selecione</option>
                  {animais
                    .filter((a) => a.sexo === 'M' && a.id !== id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        Brinco {a.brinco}
                        {a.apelido ? ` (${a.apelido})` : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mãe (animal da fazenda) *</label>
                <select
                  value={form.maeId}
                  onChange={(e) => setForm({ ...form, maeId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required={form.tipoOrigem === 'NASCIMENTO'}
                >
                  <option value="">Selecione</option>
                  {animais
                    .filter((a) => a.sexo === 'F' && a.id !== id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        Brinco {a.brinco}
                        {a.apelido ? ` (${a.apelido})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}
          {['COMPRA', 'TRANSFERENCIA'].includes(form.tipoOrigem) && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Nome do pai *</label>
                <input
                  value={form.nomePai}
                  onChange={(e) => setForm({ ...form, nomePai: e.target.value })}
                  placeholder="Nome do reprodutor"
                  className="w-full border rounded-lg px-3 py-2"
                  required={['COMPRA', 'TRANSFERENCIA'].includes(form.tipoOrigem)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nome da mãe *</label>
                <input
                  value={form.nomeMae}
                  onChange={(e) => setForm({ ...form, nomeMae: e.target.value })}
                  placeholder="Nome da matriz"
                  className="w-full border rounded-lg px-3 py-2"
                  required={['COMPRA', 'TRANSFERENCIA'].includes(form.tipoOrigem)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Propriedade de origem</label>
                <input
                  value={form.propriedadeOrigem}
                  onChange={(e) => setForm({ ...form, propriedadeOrigem: e.target.value })}
                  placeholder="Nome ou identificação"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              {form.tipoOrigem === 'COMPRA' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Valor de aquisição (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valorAquisicao}
                    onChange={(e) => setForm({ ...form, valorAquisicao: e.target.value })}
                    placeholder="0,00"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              )}
            </>
          )}
          {['COMPRA', 'TRANSFERENCIA'].includes(form.tipoOrigem) && (
            <div>
              <label className="block text-sm font-medium mb-1">Data da entrada *</label>
              <input
                type="date"
                value={form.dataEntrada}
                onChange={(e) => setForm({ ...form, dataEntrada: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Data nascimento *</label>
            <input
              type="date"
              value={form.dataNascimento}
              onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lote *</label>
            <select
              value={form.loteId}
              onChange={(e) => setForm({ ...form, loteId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Selecione</option>
              {lotes.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Piquete atual</label>
            <select
              value={form.piqueteId}
              onChange={(e) => setForm({ ...form, piqueteId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Selecione</option>
              {piquetes.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Número SISBOV</label>
            <input
              value={form.numeroSISBOV}
              onChange={(e) => setForm({ ...form, numeroSISBOV: e.target.value })}
              placeholder="Número do SISBOV"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={2}
              placeholder="Observações gerais"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="ativo" className="text-sm font-medium">Animal ativo</label>
          </div>
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
            onClick={() => navigate('/animais')}
            className="px-4 py-2 border rounded-lg"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
