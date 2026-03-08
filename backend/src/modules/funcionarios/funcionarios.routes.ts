import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const funcSchema = z.object({
  propriedadeId: z.string().uuid(),
  nome: z.string(),
  cpf: z.string().optional(),
  cnh: z.string().optional(),
  dataNascimento: z.string().optional(),
  sexo: z.string().optional(),
  funcoes: z.array(z.string()).optional(),
  telCelular: z.string().optional(),
  email: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  uf: z.string().optional(),
  municipio: z.string().optional(),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  contaBancaria: z.string().optional(),
  chavePix: z.string().optional(),
  observacao: z.string().optional(),
});

export async function funcionariosRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

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
        uf: data.uf || '',
      };
    } catch {
      return reply.status(502).send({ error: 'Erro ao consultar CEP' });
    }
  });

  app.get('/', async (req) => {
    const { propriedadeId } = req.query as { propriedadeId?: string };
    return prisma.funcionario.findMany({
      where: propriedadeId ? { propriedadeId } : {},
      include: { _count: { select: { tarefas: true } } },
      orderBy: { nome: 'asc' },
    });
  });

  app.post('/', async (req) => {
    const body = funcSchema.parse(req.body);
    const data = { ...body, dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : undefined };
    return prisma.funcionario.create({ data });
  });

  app.patch('/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = funcSchema.partial().parse(req.body);
    const data: any = { ...body };
    if (body.dataNascimento !== undefined) data.dataNascimento = body.dataNascimento ? new Date(body.dataNascimento) : null;
    return prisma.funcionario.update({ where: { id }, data });
  });

  app.delete('/:id', async (req) => {
    await prisma.funcionario.delete({ where: { id: (req.params as { id: string }).id } });
    return { ok: true };
  });
}
