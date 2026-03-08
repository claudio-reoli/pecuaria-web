import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { validarCPF, formatarCPF, formatarCNPJ, formatarCEP } from '../../utils/validacao';
import { Plus } from 'lucide-react';

const emptyForm = {
  nome: '',
  tipoPessoa: 'FISICA' as 'FISICA' | 'JURIDICA',
  cnpj: '',
  cpf: '',
  telCelular: '',
  email: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cep: '',
  municipio: '',
  banco: '',
  agencia: '',
  contaBancaria: '',
  observacao: '',
};

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [propId, setPropId] = useState('');
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [novo, setNovo] = useState(emptyForm);
  const [erroCpf, setErroCpf] = useState('');
  const [carregandoCnpj, setCarregandoCnpj] = useState(false);
  const [carregandoCep, setCarregandoCep] = useState(false);

  useEffect(() => {
    api.get('/propriedades').then((p: any) => {
      setPropriedades(p ?? []);
      if (p?.[0]) setPropId(p[0].id);
    });
  }, []);

  useEffect(() => {
    if (propId) {
      api.get<any[]>(`/fornecedores?propriedadeId=${propId}`).then((r) => setFornecedores(r ?? []));
    }
  }, [propId]);

  const abrirEdicao = (f: any) => {
    setEditId(f.id);
    setNovo({
      nome: f.nome || '',
      tipoPessoa: f.tipoPessoa || 'FISICA',
      cnpj: f.cnpj || '',
      cpf: f.cpf || '',
      telCelular: f.telCelular || '',
      email: f.email || '',
      endereco: f.endereco || '',
      numero: f.numero || '',
      complemento: f.complemento || '',
      bairro: f.bairro || '',
      cep: f.cep || '',
      municipio: f.municipio || '',
      banco: f.banco || '',
      agencia: f.agencia || '',
      contaBancaria: f.contaBancaria || '',
      observacao: f.observacao || '',
    });
    setErroCpf('');
    setForm(true);
  };

  const cancelar = () => {
    setForm(false);
    setEditId(null);
    setNovo(emptyForm);
    setErroCpf('');
  };

  const validarForm = (): boolean => {
    if (novo.tipoPessoa === 'FISICA' && novo.cpf) {
      if (!validarCPF(novo.cpf)) {
        setErroCpf('CPF inválido');
        return false;
      }
    }
    setErroCpf('');
    return true;
  };

  const salvar = async () => {
    if (!validarForm()) return;
    const payload = {
      ...novo,
      propriedadeId: propId,
      cnpj: novo.tipoPessoa === 'JURIDICA' ? (novo.cnpj || undefined) : undefined,
      cpf: novo.tipoPessoa === 'FISICA' ? (novo.cpf || undefined) : undefined,
    };
    if (editId) {
      await api.patch(`/fornecedores/${editId}`, payload);
    } else {
      await api.post('/fornecedores', payload);
    }
    const lista = await api.get<any[]>(`/fornecedores?propriedadeId=${propId}`);
    setFornecedores(lista ?? []);
    cancelar();
  };

  const excluir = async (f: any) => {
    if (!window.confirm(`Excluir fornecedor ${f.nome}?`)) return;
    await api.delete(`/fornecedores/${f.id}`);
    setFornecedores((prev) => prev.filter((x) => x.id !== f.id));
  };

  const consultarCnpj = async () => {
    const dig = novo.cnpj.replace(/\D/g, '');
    if (dig.length !== 14) return;
    setCarregandoCnpj(true);
    try {
      const d = await api.get<Record<string, string>>(`/fornecedores/consulta-cnpj/${dig}`);
      setNovo((prev) => ({
        ...prev,
        nome: d.nome || prev.nome,
        endereco: d.endereco || prev.endereco,
        numero: d.numero || prev.numero,
        complemento: d.complemento || prev.complemento,
        bairro: d.bairro || prev.bairro,
        cep: d.cep || prev.cep,
        municipio: d.municipio || prev.municipio,
        email: d.email || prev.email,
        telCelular: d.telCelular || prev.telCelular,
      }));
    } catch {
      /* ignora */
    } finally {
      setCarregandoCnpj(false);
    }
  };

  const consultarCep = async () => {
    const dig = novo.cep.replace(/\D/g, '');
    if (dig.length !== 8) return;
    setCarregandoCep(true);
    try {
      const d = await api.get<Record<string, string>>(`/fornecedores/consulta-cep/${dig}`);
      setNovo((prev) => ({
        ...prev,
        endereco: d.endereco || prev.endereco,
        bairro: d.bairro || prev.bairro,
        municipio: d.municipio || prev.municipio,
      }));
    } catch {
      /* ignora */
    } finally {
      setCarregandoCep(false);
    }
  };

  const handleCpfChange = (v: string) => {
    setNovo({ ...novo, cpf: formatarCPF(v) });
    setErroCpf('');
    if (v.replace(/\D/g, '').length === 11) {
      setErroCpf(validarCPF(v) ? '' : 'CPF inválido');
    }
  };

  const handleCnpjChange = (v: string) => {
    setNovo({ ...novo, cnpj: formatarCNPJ(v) });
  };

  const handleCnpjBlur = () => {
    if (novo.tipoPessoa === 'JURIDICA') consultarCnpj();
  };

  const handleCepChange = (v: string) => {
    setNovo({ ...novo, cep: formatarCEP(v) });
  };

  const handleCepBlur = () => {
    if (novo.cep.replace(/\D/g, '').length === 8) consultarCep();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Fornecedores</h1>
      <div className="flex gap-4 mb-4">
        <select
          value={propId}
          onChange={(e) => setPropId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {propriedades.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setNovo(emptyForm);
            setErroCpf('');
            setForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg"
        >
          <Plus size={18} /> Novo fornecedor
        </button>
      </div>

      {form && (
        <div className="bg-white p-6 rounded shadow mb-6 max-w-2xl">
          <h2 className="font-semibold mb-4">
            {editId ? 'Editar fornecedor' : 'Novo fornecedor'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Tipo da Pessoa</label>
              <select
                value={novo.tipoPessoa}
                onChange={(e) =>
                  setNovo({
                    ...novo,
                    tipoPessoa: e.target.value as 'FISICA' | 'JURIDICA',
                    cnpj: e.target.value === 'FISICA' ? '' : novo.cnpj,
                    cpf: e.target.value === 'JURIDICA' ? '' : novo.cpf,
                  })
                }
                className="border rounded px-2 py-1 w-full"
              >
                <option value="FISICA">Pessoa Física</option>
                <option value="JURIDICA">Pessoa Jurídica</option>
              </select>
            </div>

            {novo.tipoPessoa === 'JURIDICA' ? (
              <div>
                <label className="block text-sm text-gray-500 mb-1">CNPJ</label>
                <input
                  value={novo.cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  onBlur={handleCnpjBlur}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="00.000.000/0001-00"
                  disabled={carregandoCnpj}
                />
                {carregandoCnpj && <span className="text-xs text-gray-500">Consultando...</span>}
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-500 mb-1">CPF</label>
                <input
                  value={novo.cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  className={`border rounded px-2 py-1 w-full ${erroCpf ? 'border-red-500' : ''}`}
                  placeholder="000.000.000-00"
                />
                {erroCpf && <span className="text-xs text-red-600">{erroCpf}</span>}
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-500 mb-1">Nome</label>
              <input
                value={novo.nome}
                onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="Nome"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Tel. Celular</label>
              <input
                value={novo.telCelular}
                onChange={(e) => setNovo({ ...novo, telCelular: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">E-mail</label>
              <input
                type="email"
                value={novo.email}
                onChange={(e) => setNovo({ ...novo, email: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-500 mb-1">CEP</label>
              <input
                value={novo.cep}
                onChange={(e) => handleCepChange(e.target.value)}
                onBlur={handleCepBlur}
                className="border rounded px-2 py-1 w-full"
                placeholder="00000-000"
                disabled={carregandoCep}
              />
              {carregandoCep && <span className="text-xs text-gray-500">Consultando...</span>}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Endereço</label>
              <input
                value={novo.endereco}
                onChange={(e) => setNovo({ ...novo, endereco: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="Rua, Avenida..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Número</label>
              <input
                value={novo.numero}
                onChange={(e) => setNovo({ ...novo, numero: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="Nº"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Complemento</label>
              <input
                value={novo.complemento}
                onChange={(e) => setNovo({ ...novo, complemento: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="Apto, Sala..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Bairro</label>
              <input
                value={novo.bairro}
                onChange={(e) => setNovo({ ...novo, bairro: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="Bairro"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Município</label>
              <input
                value={novo.municipio}
                onChange={(e) => setNovo({ ...novo, municipio: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="Cidade"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Banco</label>
              <input
                value={novo.banco}
                onChange={(e) => setNovo({ ...novo, banco: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="Nome do banco"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Agência</label>
              <input
                value={novo.agencia}
                onChange={(e) => setNovo({ ...novo, agencia: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="Agência"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Conta Bancária</label>
              <input
                value={novo.contaBancaria}
                onChange={(e) => setNovo({ ...novo, contaBancaria: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="Conta"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-500 mb-1">Observação</label>
              <textarea
                value={novo.observacao}
                onChange={(e) => setNovo({ ...novo, observacao: e.target.value })}
                rows={2}
                className="border rounded px-2 py-1 w-full resize-none"
                placeholder="Observações..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={salvar}
              disabled={!!erroCpf || (novo.tipoPessoa === 'FISICA' && novo.cpf && !validarCPF(novo.cpf))}
              className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50"
            >
              Salvar
            </button>
            <button onClick={cancelar} className="px-4 py-2 border rounded">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">CNPJ/CPF</th>
              <th className="text-left p-3">E-mail</th>
              <th className="text-left p-3">Telefone</th>
              <th className="text-right p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3">{f.nome}</td>
                <td className="p-3">{f.tipoPessoa === 'JURIDICA' ? 'Jurídica' : 'Física'}</td>
                <td className="p-3">{f.tipoPessoa === 'JURIDICA' ? f.cnpj : f.cpf || '—'}</td>
                <td className="p-3">{f.email || '—'}</td>
                <td className="p-3">{f.telCelular || '—'}</td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    onClick={() => abrirEdicao(f)}
                    className="text-primary-600 hover:underline mr-2"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => excluir(f)}
                    className="text-red-600 hover:underline"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
