import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema = z.object({
  nome: z.string().min(2),
  cnpj: z.string().optional(),
  areaTotal: z.number().optional(),
});

export async function propriedadeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async () => {
    return prisma.propriedade.findMany({ orderBy: { nome: 'asc' } });
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return prisma.propriedade.findUniqueOrThrow({
      where: { id },
      include: {
        _count: { select: { animais: true, lotes: true } },
      },
    });
  });

  app.post('/', async (request) => {
    const body = createSchema.parse(request.body);
    return prisma.propriedade.create({ data: body });
  });

  app.patch('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = createSchema.partial().parse(request.body);
    return prisma.propriedade.update({ where: { id }, data: body });
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.propriedade.delete({ where: { id } });
    return { ok: true };
  });
}
