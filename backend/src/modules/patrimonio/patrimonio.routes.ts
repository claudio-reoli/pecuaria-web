import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const bemSchema = z.object({
  propriedadeId: z.string().uuid(),
  codigo: z.string().optional(),
  descricao: z.string(),
  categoria: z.string(),
  tipo: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  dataAquisicao: z.string().optional(),
  valorCompra: z.number().optional(),
  responsavel: z.string().optional(),
});

export async function patrimonioRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (req) => {
    const { propriedadeId } = req.query as { propriedadeId?: string };
    return prisma.bemPatrimonial.findMany({
      where: propriedadeId ? { propriedadeId } : {},
      orderBy: { descricao: 'asc' },
    });
  });

  app.post('/', async (req) => {
    const body = bemSchema.parse(req.body);
    const data = { ...body, dataAquisicao: body.dataAquisicao ? new Date(body.dataAquisicao) : undefined };
    return prisma.bemPatrimonial.create({ data });
  });

  app.patch('/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = bemSchema.partial().parse(req.body);
    const data = { ...body, dataAquisicao: body.dataAquisicao ? new Date(body.dataAquisicao) : undefined };
    return prisma.bemPatrimonial.update({ where: { id }, data });
  });

  app.delete('/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.bemPatrimonial.delete({ where: { id } });
    return { ok: true };
  });
}
