import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema = z.object({
  animalId: z.string().uuid(),
  data: z.string().datetime().or(z.date()),
  peso: z.number().positive(),
  loteId: z.string().uuid().optional(),
  equipamento: z.string().optional(),
  responsavel: z.string().optional(),
});

export async function pesagemRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (request) => {
    const q = request.query as { animalId?: string; propriedadeId?: string; desde?: string; ate?: string };
    const where: any = {};
    if (q.animalId) where.animalId = q.animalId;
    if (q.desde || q.ate) {
      where.data = {};
      if (q.desde) where.data.gte = new Date(q.desde);
      if (q.ate) where.data.lte = new Date(q.ate);
    }
    if (q.propriedadeId) {
      where.animal = { propriedadeId: q.propriedadeId };
    }
    return prisma.pesagem.findMany({
      where,
      include: { animal: { select: { id: true, brinco: true } } },
      orderBy: { data: 'desc' },
      take: 200,
    });
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return prisma.pesagem.findUniqueOrThrow({
      where: { id },
      include: { animal: { select: { id: true, brinco: true } } },
    });
  });

  app.post('/', async (request) => {
    const body = createSchema.parse(request.body);
    const data = {
      ...body,
      data: new Date(body.data),
    };
    return prisma.pesagem.create({
      data,
      include: { animal: { select: { id: true, brinco: true } } },
    });
  });

  app.patch('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = createSchema.partial().parse(request.body);
    const data = { ...body };
    if (body.data) data.data = new Date(body.data);
    return prisma.pesagem.update({
      where: { id },
      data,
      include: { animal: { select: { id: true, brinco: true } } },
    });
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.pesagem.delete({ where: { id } });
    return { ok: true };
  });
}
