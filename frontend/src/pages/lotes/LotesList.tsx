import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Plus } from 'lucide-react';

interface Lote {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  piquete: { nome: string } | null;
  _count: { animais: number };
}

export default function LotesList() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Lote[]>('/lotes')
      .then(setLotes)
      .catch(() => setLotes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Lotes</h1>
        <Link
          to="/lotes/novo"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          Novo lote
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Carregando...</p>
        ) : lotes.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Nenhum lote cadastrado</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Categoria</th>
                <th className="text-left px-4 py-3 font-medium">Animais</th>
                <th className="text-left px-4 py-3 font-medium">Piquete</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => (
                <tr key={l.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{l.nome}</td>
                  <td className="px-4 py-3">{l.categoria}</td>
                  <td className="px-4 py-3">{l._count?.animais ?? l.quantidade ?? 0}</td>
                  <td className="px-4 py-3">{l.piquete?.nome || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/lotes/${l.id}`} className="text-primary-600 hover:underline mr-3">
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Excluir lote ${l.nome}?`)) {
                          api.delete(`/lotes/${l.id}`).then(() => {
                            setLotes((prev) => prev.filter((x) => x.id !== l.id));
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
        )}
      </div>
    </div>
  );
}
