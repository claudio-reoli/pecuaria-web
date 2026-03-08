import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const medicamentoSchema = z.object({
  propriedadeId: z.string().uuid(),
  nome: z.string().min(2),
  principioAtivo: z.string().optional(),
  tipo: z.enum(['vacina', 'medicamento', 'antiparasitario']),
  estoque: z.number().default(0),
  estoqueMinimo: z.number().optional(),
  unidade: z.string().default('unidade'),
});

const vacinacaoSchema = z.object({
  animalId: z.string().uuid(),
  medicamentoId: z.string().uuid(),
  data: z.string().datetime().or(z.date()),
  loteVacina: z.string().optional(),
  validade: z.string().datetime().optional().or(z.date().optional()),
  dose: z.number().optional(),
  viaAplicacao: z.string().optional(),
  responsavel: z.string().optional(),
  animaisTotal: z.number().optional(),
});

export async function sanidadeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/medicamentos', async (request) => {
    const { propriedadeId } = request.query as { propriedadeId?: string };
    return prisma.medicamento.findMany({
      where: propriedadeId ? { propriedadeId } : {},
      orderBy: { nome: 'asc' },
    });
  });

  app.post('/medicamentos', async (request) => {
    const body = medicamentoSchema.parse(request.body);
    return prisma.medicamento.create({ data: body });
  });

  app.patch('/medicamentos/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = medicamentoSchema.partial().parse(request.body);
    return prisma.medicamento.update({ where: { id }, data: body });
  });

  app.delete('/medicamentos/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.medicamento.delete({ where: { id } });
    return { ok: true };
  });

  app.get('/vacinacoes', async (request) => {
    const q = request.query as { animalId?: string; propriedadeId?: string; desde?: string };
    const where: any = {};
    if (q.animalId) where.animalId = q.animalId;
    if (q.desde) where.data = { gte: new Date(q.desde) };
    if (q.propriedadeId) where.animal = { propriedadeId: q.propriedadeId };
    return prisma.vacinacao.findMany({
      where,
      include: { animal: { select: { id: true, brinco: true } }, medicamento: true },
      orderBy: { data: 'desc' },
      take: 200,
    });
  });

  app.patch('/vacinacoes/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = vacinacaoSchema.partial().parse(request.body);
    const data: any = { ...body };
    if (body.data) data.data = new Date(body.data);
    if (body.validade) data.validade = new Date(body.validade);
    return prisma.vacinacao.update({
      where: { id },
      data,
      include: { animal: { select: { id: true, brinco: true } }, medicamento: true },
    });
  });

  app.delete('/vacinacoes/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.vacinacao.delete({ where: { id } });
    return { ok: true };
  });

  app.post('/vacinacoes', async (request) => {
    const body = vacinacaoSchema.parse(request.body);
    const vacina = await prisma.vacinacao.create({
      data: {
        ...body,
        data: new Date(body.data),
        validade: body.validade ? new Date(body.validade) : undefined,
      },
      include: { animal: { select: { id: true, brinco: true } }, medicamento: true },
    });
    await prisma.medicamento.update({
      where: { id: body.medicamentoId },
      data: { estoque: { decrement: body.dose || 1 } },
    });
    return vacina;
  });
}
