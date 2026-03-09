import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema = z.object({
  animalId: z.string().uuid(),
  loteOrigemId: z.string().uuid().optional(),
  loteDestinoId: z.string().uuid().optional().nullable(),
  data: z.string(),
  motivo: z.string(),
  causa: z.string().optional(),
  observacao: z.string().optional(),
});
const MOTIVOS_SAIDA = ['morte', 'venda', 'abate interno', 'perda', 'roubo'];

export async function movimentacaoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (req) => {
    const { animalId, loteDestinoId, desde } = req.query as { animalId?: string; loteDestinoId?: string; desde?: string };
    const where: any = {};
    if (animalId) where.animalId = animalId;
    if (loteDestinoId) where.loteDestinoId = loteDestinoId;
    if (desde) where.data = { gte: new Date(desde) };
    return prisma.movimentacao.findMany({
      where,
      include: { animal: { select: { id: true, brinco: true } }, loteDestino: { select: { id: true, nome: true } } },
      orderBy: { data: 'desc' },
      take: 200,
    });
  });

  app.post('/', async (req) => {
    const body = createSchema.parse(req.body);
    const loteDestinoId = body.loteDestinoId || null;
    const mov = await prisma.movimentacao.create({
      data: { ...body, loteDestinoId, data: new Date(body.data) },
      include: { animal: true, loteDestino: true },
    });
    if (!MOTIVOS_SAIDA.includes(body.motivo) && loteDestinoId) {
      await prisma.animal.update({ where: { id: body.animalId }, data: { loteId: loteDestinoId } });
    }
    return mov;
  });

  app.patch('/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = createSchema.partial().parse(req.body);
    const data: any = { ...body };
    if (body.data) data.data = new Date(body.data);
    return prisma.movimentacao.update({
      where: { id },
      data,
      include: { animal: true, loteDestino: true },
    });
  });

  app.delete('/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.movimentacao.delete({ where: { id } });
    return { ok: true };
  });
}
