/**
 * Módulo de IA - Proxy para o serviço Python (RIA-01 a RIA-35)
 * Toda a lógica de ML/IA roda no ia-service (Python).
 * Os módulos transacionais (animais, lotes, etc.) ficam em Node.js.
 */
import { FastifyInstance } from 'fastify';
import { config } from '../../config.js';

const IA_BASE = config.iaServiceUrl;

async function proxyToPython(
  url: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<unknown> {
  const res = await fetch(`${IA_BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `IA service error: ${res.status}`);
  }
  return res.json();
}

export async function iaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/health', async () => {
    const res = await fetch(`${IA_BASE}/health`);
    const data = await res.json();
    return { ...data, backend: 'node', iaService: IA_BASE };
  });

  app.get('/ria', async () => proxyToPython('/ria', 'GET'));

  // Proxy genérico: encaminha /api/ia/* para Python /ia/*
  app.all('/*', async (request) => {
    const params = request.params as { '*'?: string };
    const path = params['*'] || '';
    const pyUrl = path.startsWith('ia/') ? `/${path}` : `/ia/${path}`;
    return proxyToPython(pyUrl, request.method, request.body as object);
  });
}
