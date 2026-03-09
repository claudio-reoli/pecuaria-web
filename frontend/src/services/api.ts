const getToken = () => localStorage.getItem('token');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
      ...init?.headers,
    },
  });
  const text = await res.text();
  let data: T & { error?: string };
  try {
    data = (text ? JSON.parse(text) : {}) as T & { error?: string };
  } catch {
    data = {} as T & { error?: string };
  }
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  uploadImage: async (formData: FormData): Promise<{ url: string }> => {
    const res = await fetch('/api/upload/imagem', {
      method: 'POST',
      headers: { ...(getToken() && { Authorization: `Bearer ${getToken()}` }) },
      body: formData,
    });
    const text = await res.text();
    let data: { url?: string; error?: string } = {};
    try {
      if (text) data = JSON.parse(text);
    } catch {
      /* resposta vazia ou inválida */
    }
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    if (!data.url) throw new Error('Resposta inválida do servidor');
    return data as { url: string };
  },
};
