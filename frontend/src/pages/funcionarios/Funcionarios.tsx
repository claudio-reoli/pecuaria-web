import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { validarCPF, formatarCPF, formatarCEP } from '../../utils/validacao';
import { Plus } from 'lucide-react';

const FUNCOES = [
  'Ordenhador',
  'Zootecnista',
  'Tratorista',
  'Agrônomo',
  'Ajudante',
  'Médico Veterinário',
  'Serviços Gerais',
  'Inseminador',
  'Gerente',
  'Encarregado de Escritório',
  'Vaqueiro',
  'Caseiro',
];

const emptyForm = {
  nome: '',
  cpf: '',
  cnh: '',
  dataNascimento: '',
  sexo: '',
  funcoes: [] as string[],
  telCelular: '',
  email: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  uf: '',
  municipio: '',
  banco: '',
  agencia: '',
  contaBancaria: '',
  chavePix: '',
  observacao: '',
};

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [propId, setPropId] = useState('');
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [novo, setNovo] = useState(emptyForm);
  const [erroCpf, setErroCpf] = useState('');
  const [carregandoCep, setCarregandoCep] = useState(false);

  useEffect(() => {
    api.get('/propriedades').then((p: any) => {
      setPropriedades(p ?? []);
      if (p?.[0]) setPropId(p[0].id);
    });
  }, []);
  useEffect(() => {
    if (propId) api.get<any[]>(`/funcionarios?propriedadeId=${propId}`).then((r) => setFuncionarios(r ?? []));
  }, [propId]);

  const abrirEdicao = (f: any) => {
    setEditId(f.id);
    setNovo({
      nome: f.nome ?? '',
      cpf: f.cpf ?? '',
      cnh: f.cnh ?? '',
      dataNascimento: f.dataNascimento ? new Date(f.dataNascimento).toISOString().slice(0, 10) : '',
      sexo: f.sexo ?? '',
      funcoes: Array.isArray(f.funcoes) ? f.funcoes : (f.funcao ? [f.funcao] : []),
      telCelular: f.telCelular ?? '',
      email: f.email ?? '',
      cep: f.cep ?? '',
      endereco: f.endereco ?? '',
      numero: f.numero ?? '',
      complemento: f.complemento ?? '',
      bairro: f.bairro ?? '',
      uf: f.uf ?? '',
      municipio: f.municipio ?? '',
      banco: f.banco ?? '',
      agencia: f.agencia ?? '',
      contaBancaria: f.contaBancaria ?? '',
      chavePix: f.chavePix ?? '',
      observacao: f.observacao ?? '',
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

  const consultarCep = async () => {
    const dig = novo.cep.replace(/\D/g, '');
    if (dig.length !== 8) return;
    setCarregandoCep(true);
    try {
      const d = await api.get<Record<string, string>>(`/funcionarios/consulta-cep/${dig}`);
      setNovo((prev) => ({
        ...prev,
        endereco: d.endereco || prev.endereco,
        bairro: d.bairro || prev.bairro,
        municipio: d.municipio || prev.municipio,
        uf: d.uf || prev.uf,
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

  const handleCepChange = (v: string) => {
    setNovo({ ...novo, cep: formatarCEP(v) });
  };

  const handleCepBlur = () => {
    if (novo.cep.replace(/\D/g, '').length === 8) consultarCep();
  };

  const salvar = async () => {
    if (novo.cpf && !validarCPF(novo.cpf)) {
      setErroCpf('CPF inválido');
      return;
    }
    const payload = { ...novo, propriedadeId: propId, dataNascimento: novo.dataNascimento || undefined };
    if (editId) {
      await api.patch(`/funcionarios/${editId}`, payload);
    } else {
      await api.post('/funcionarios', payload);
    }
    const lista = await api.get<any[]>(`/funcionarios?propriedadeId=${propId}`);
    setFuncionarios(lista ?? []);
    cancelar();
  };

  const excluir = async (f: any) => {
    if (!window.confirm(`Excluir funcionário ${f.nome}?`)) return;
    await api.delete(`/funcionarios/${f.id}`);
    setFuncionarios((prev) => prev.filter((x) => x.id !== f.id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Funcionários</h1>
      <div className="flex gap-4 mb-4">
        <select value={propId} onChange={(e) => setPropId(e.target.value)} className="border rounded px-3 py-2">
          {propriedades.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
        <button onClick={() => { setNovo(emptyForm); setErroCpf(''); setForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg">
          <Plus size={18} /> Novo funcionário
        </button>
      </div>

      {form && (
        <div className="bg-white p-6 rounded shadow mb-6 max-w-2xl">
          <h2 className="font-semibold mb-4">{editId ? 'Editar funcionário' : 'Novo funcionário'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-500 mb-1">Nome</label>
              <input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Nome" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">CPF</label>
              <input value={novo.cpf} onChange={(e) => handleCpfChange(e.target.value)} className={`border rounded px-2 py-1 w-full ${erroCpf ? 'border-red-500' : ''}`} placeholder="000.000.000-00" />
              {erroCpf && <span className="text-xs text-red-600">{erroCpf}</span>}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">CNH</label>
              <input value={novo.cnh} onChange={(e) => setNovo({ ...novo, cnh: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Número da CNH" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Data de Nascimento</label>
              <input type="date" value={novo.dataNascimento} onChange={(e) => setNovo({ ...novo, dataNascimento: e.target.value })} className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Sexo</label>
              <select value={novo.sexo} onChange={(e) => setNovo({ ...novo, sexo: e.target.value })} className="border rounded px-2 py-1 w-full">
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-500 mb-2">Funções</label>
              <div className="flex flex-wrap gap-3">
                {FUNCOES.map((f) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novo.funcoes.includes(f)}
                      onChange={(e) => {
                        if (e.target.checked) setNovo({ ...novo, funcoes: [...novo.funcoes, f] });
                        else setNovo({ ...novo, funcoes: novo.funcoes.filter((x) => x !== f) });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{f}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Tel. Celular</label>
              <input value={novo.telCelular} onChange={(e) => setNovo({ ...novo, telCelular: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">E-mail</label>
              <input type="email" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="email@exemplo.com" />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">CEP</label>
              <input value={novo.cep} onChange={(e) => handleCepChange(e.target.value)} onBlur={handleCepBlur} className="border rounded px-2 py-1 w-full" placeholder="00000-000" disabled={carregandoCep} />
              {carregandoCep && <span className="text-xs text-gray-500">Consultando...</span>}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Endereço</label>
              <input value={novo.endereco} onChange={(e) => setNovo({ ...novo, endereco: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Rua, Avenida..." />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Número</label>
              <input value={novo.numero} onChange={(e) => setNovo({ ...novo, numero: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Nº" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Complemento</label>
              <input value={novo.complemento} onChange={(e) => setNovo({ ...novo, complemento: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Apto, Sala..." />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Bairro</label>
              <input value={novo.bairro} onChange={(e) => setNovo({ ...novo, bairro: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Bairro" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">UF</label>
              <input value={novo.uf} onChange={(e) => setNovo({ ...novo, uf: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="UF" maxLength={2} />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Município</label>
              <input value={novo.municipio} onChange={(e) => setNovo({ ...novo, municipio: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Cidade" />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Banco</label>
              <input value={novo.banco} onChange={(e) => setNovo({ ...novo, banco: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Nome do banco" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Agência</label>
              <input value={novo.agencia} onChange={(e) => setNovo({ ...novo, agencia: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Agência" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Conta Bancária</label>
              <input value={novo.contaBancaria} onChange={(e) => setNovo({ ...novo, contaBancaria: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Conta" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Chave Pix</label>
              <input value={novo.chavePix} onChange={(e) => setNovo({ ...novo, chavePix: e.target.value })} className="border rounded px-2 py-1 w-full" placeholder="Chave Pix" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-500 mb-1">Observação</label>
              <textarea value={novo.observacao} onChange={(e) => setNovo({ ...novo, observacao: e.target.value })} rows={2} className="border rounded px-2 py-1 w-full resize-none" placeholder="Observações..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={salvar} disabled={!!erroCpf || (novo.cpf && !validarCPF(novo.cpf))} className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50">Salvar</button>
            <button onClick={cancelar} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">CPF</th>
              <th className="text-left p-3">Função</th>
              <th className="text-left p-3">Telefone</th>
              <th className="text-right p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3">{f.nome}</td>
                <td className="p-3">{f.cpf || '—'}</td>
                <td className="p-3">{(Array.isArray(f.funcoes) ? f.funcoes : f.funcao ? [f.funcao] : []).join(', ') || '—'}</td>
                <td className="p-3">{f.telCelular || '—'}</td>
                <td className="p-3 text-right">
                  <button type="button" onClick={() => abrirEdicao(f)} className="text-primary-600 hover:underline mr-2">Editar</button>
                  <button type="button" onClick={() => excluir(f)} className="text-red-600 hover:underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
