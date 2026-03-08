import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';

export default function PesagemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [animais, setAnimais] = useState<{ id: string; brinco: string }[]>([]);
  const [form, setForm] = useState({
    animalId: '',
    data: new Date().toISOString().slice(0, 16),
    peso: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ id: string; brinco: string }[]>('/animais').then(setAnimais);
  }, []);

  useEffect(() => {
    if (id) {
      api.get<{ animalId?: string; animal?: { id: string }; data: string; peso: number }>(`/pesagens/${id}`).then((p) => {
        setForm({
          animalId: p.animalId ?? p.animal?.id ?? '',
          data: new Date(p.data).toISOString().slice(0, 16),
          peso: String(p.peso),
        });
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.animalId || !form.peso) return;
    setLoading(true);
    try {
      const payload = { animalId: form.animalId, data: new Date(form.data).toISOString(), peso: Number(form.peso) };
      if (id) {
        await api.patch(`/pesagens/${id}`, payload);
      } else {
        await api.post('/pesagens', payload);
      }
      navigate('/pesagens');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{id ? 'Editar pesagem' : 'Nova pesagem'}</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 bg-white p-6 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Animal *</label>
          <select
            value={form.animalId}
            onChange={(e) => setForm({ ...form, animalId: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">Selecione</option>
            {animais.map((a) => (
              <option key={a.id} value={a.id}>Brinco {a.brinco}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data e hora</label>
          <input
            type="datetime-local"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Peso (kg) *</label>
          <input
            type="number"
            step="0.01"
            value={form.peso}
            onChange={(e) => setForm({ ...form, peso: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
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
            onClick={() => navigate('/pesagens')}
            className="px-4 py-2 border rounded-lg"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
