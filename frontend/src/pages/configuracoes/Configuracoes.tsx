import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function Configuracoes() {
  const [form, setForm] = useState({ googleMapsApiKey: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ googleMapsApiKey: string }>('/config')
      .then((r) => setForm({ googleMapsApiKey: r?.googleMapsApiKey ?? '' }))
      .catch(() => setForm({ googleMapsApiKey: '' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/config', { googleMapsApiKey: form.googleMapsApiKey.trim() || null });
      alert('Configurações salvas.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">Carregando...</span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-6 bg-white p-6 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chave da API do Google Maps
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Usada no mapa de perímetro dos piquetes. Obtenha em{' '}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              console.cloud.google.com/apis/credentials
            </a>
            . Ative: Maps JavaScript API e Drawing Library.
          </p>
          <input
            type="password"
            value={form.googleMapsApiKey}
            onChange={(e) => setForm({ ...form, googleMapsApiKey: e.target.value })}
            placeholder="AIza..."
            className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
