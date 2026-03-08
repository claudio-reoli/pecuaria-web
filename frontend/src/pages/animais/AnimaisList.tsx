import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Plus, Search } from 'lucide-react';

interface Animal {
  id: string;
  brinco: string;
  apelido: string | null;
  sexo: string;
  categoria: string;
  raca: string | null;
  lote: { id: string; nome: string } | null;
}

export default function AnimaisList() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api
      .get<Animal[]>(`/animais${q}`)
      .then(setAnimais)
      .catch(() => setAnimais([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Animais</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Brinco ou apelido"
              className="pl-9 pr-4 py-2 border rounded-lg w-48"
            />
          </div>
          <Link
            to="/animais/novo"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={20} />
            Novo animal
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Carregando...</p>
        ) : animais.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Nenhum animal cadastrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Brinco</th>
                  <th className="text-left px-4 py-3 font-medium">Apelido</th>
                  <th className="text-left px-4 py-3 font-medium">Sexo</th>
                  <th className="text-left px-4 py-3 font-medium">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium">Lote</th>
                  <th className="text-right px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {animais.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{a.brinco}</td>
                    <td className="px-4 py-3">{a.apelido || '—'}</td>
                    <td className="px-4 py-3">{a.sexo === 'M' ? 'Macho' : 'Fêmea'}</td>
                    <td className="px-4 py-3">{a.categoria}</td>
                    <td className="px-4 py-3">{a.lote?.nome || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/animais/${a.id}`} className="text-primary-600 hover:underline mr-3">
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Excluir animal ${a.brinco}?`)) {
                            api.delete(`/animais/${a.id}`).then(() => {
                              setAnimais((prev) => prev.filter((x) => x.id !== a.id));
                            });
                          }
                        }}
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
        )}
      </div>
    </div>
  );
}
