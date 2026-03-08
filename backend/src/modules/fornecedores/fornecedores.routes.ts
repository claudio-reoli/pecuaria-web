import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema = z.object({
  propriedadeId: z.string().uuid(),
  nome: z.string(),
  tipoPessoa: z.enum(['FISICA', 'JURIDICA']),
  cnpj: z.string().optional(),
  cpf: z.string().optional(),
  telCelular: z.string().optional(),
  email: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cep: z.string().optional(),
  municipio: z.string().optional(),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  contaBancaria: z.string().optional(),
  observacao: z.string().optional(),
});

export async function fornecedoresRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (req) => {
    const { propriedadeId } = req.query as { propriedadeId?: string };
    return prisma.fornecedor.findMany({
      where: propriedadeId ? { propriedadeId } : {},
      orderBy: { nome: 'asc' },
    });
  });

  app.get('/consulta-cnpj/:cnpj', async (req, reply) => {
    const { cnpj } = req.params as { cnpj: string };
    const dig = cnpj.replace(/\D/g, '');
    if (dig.length !== 14) {
      return reply.status(400).send({ error: 'CNPJ deve ter 14 dígitos' });
    }
    try {
      const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${dig}`);
      const data = await res.json();
      if (data.status === 'ERROR') {
        return reply.status(404).send({ error: data.message || 'CNPJ não encontrado' });
      }
      return {
        nome: data.nome || data.fantasia || '',
        endereco: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cep: (data.cep || '').replace(/\D/g, ''),
        municipio: data.municipio || '',
        email: data.email || '',
        telCelular: data.telefone || '',
      };
    } catch (e) {
      return reply.status(502).send({ error: 'Erro ao consultar CNPJ' });
    }
  });

  app.get('/consulta-cep/:cep', async (req, reply) => {
    const { cep } = req.params as { cep: string };
    const dig = cep.replace(/\D/g, '');
    if (dig.length !== 8) {
      return reply.status(400).send({ error: 'CEP deve ter 8 dígitos' });
    }
    try {
      const res = await fetch(`https://viacep.com.br/ws/${dig}/json/`);
      const data = await res.json();
      if (data.erro) {
        return reply.status(404).send({ error: 'CEP não encontrado' });
      }
      return {
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        municipio: data.localidade || '',
      };
    } catch (e) {
      return reply.status(502).send({ error: 'Erro ao consultar CEP' });
    }
  });

  app.post('/', async (req) => prisma.fornecedor.create({ data: createSchema.parse(req.body) }));
  app.patch('/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.fornecedor.update({ where: { id }, data: createSchema.partial().parse(req.body) });
  });
  app.delete('/:id', async (req) => {
    await prisma.fornecedor.delete({ where: { id: (req.params as { id: string }).id } });
    return { ok: true };
  });
}
