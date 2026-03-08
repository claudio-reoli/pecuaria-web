import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Plus } from 'lucide-react';

interface Pesagem {
  id: string;
  data: string;
  peso: number;
  animal: { id: string; brinco: string };
}

export default function PesagemList() {
  const [pesagens, setPesagens] = useState<Pesagem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Pesagem[]>('/pesagens')
      .then(setPesagens)
      .catch(() => setPesagens([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pesagens</h1>
        <Link
          to="/pesagens/nova"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          Nova pesagem
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Carregando...</p>
        ) : pesagens.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Nenhuma pesagem registrada</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Brinco</th>
                <th className="text-left px-4 py-3 font-medium">Peso (kg)</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pesagens.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 font-medium">{p.animal.brinco}</td>
                  <td className="px-4 py-3">{p.peso}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/pesagens/${p.id}`} className="text-primary-600 hover:underline mr-3">Editar</Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Excluir pesagem?')) {
                          api.delete(`/pesagens/${p.id}`).then(() => {
                            setPesagens((prev) => prev.filter((x) => x.id !== p.id));
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
