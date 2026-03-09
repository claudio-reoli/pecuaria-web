import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema = z.object({
  propriedadeId: z.string().uuid(),
  animalId: z.string().uuid(),
  loteId: z.string().uuid().optional().nullable(),
  data: z.string(),
  tipoManejo: z.string(),
  responsavelPrescricao: z.string().optional(),
  responsavelAplicacao: z.string().optional(),
  medicamento: z.string().optional(),
  fotoProduto: z.string().optional(),
  fotoReceita: z.string().optional(),
  formaFarmaceutica: z.string().optional(),
  dosagemPosologia: z.string().optional(),
  viaAdministracao: z.string().optional(),
  frequenciaDuracao: z.string().optional(),
  carencia: z.string().optional(),
  observacao: z.string().optional(),
});

export async function manejoSanitarioRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (req) => {
    const q = req.query as { propriedadeId?: string; animalId?: string; desde?: string };
    const where: any = {};
    if (q.propriedadeId) where.propriedadeId = q.propriedadeId;
    if (q.animalId) where.animalId = q.animalId;
    if (q.desde) where.data = { gte: new Date(q.desde) };
    return prisma.manejoSanitario.findMany({
      where,
      include: {
        animal: { select: { id: true, brinco: true } },
        lote: { select: { id: true, nome: true } },
        propriedade: { select: { id: true, nome: true } },
      },
      orderBy: { data: 'desc' },
      take: 200,
    });
  });

  app.post('/', async (req) => {
    const body = createSchema.parse(req.body);
    return prisma.manejoSanitario.create({
      data: {
        ...body,
        loteId: body.loteId || null,
        data: new Date(body.data),
      },
      include: {
        animal: { select: { id: true, brinco: true } },
        lote: { select: { id: true, nome: true } },
        propriedade: { select: { id: true, nome: true } },
      },
    });
  });

  app.patch('/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = createSchema.partial().parse(req.body);
    const data: any = { ...body };
    if (body.data) data.data = new Date(body.data);
    return prisma.manejoSanitario.update({
      where: { id },
      data,
      include: {
        animal: { select: { id: true, brinco: true } },
        lote: { select: { id: true, nome: true } },
        propriedade: { select: { id: true, nome: true } },
      },
    });
  });

  app.delete('/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.manejoSanitario.delete({ where: { id } });
    return { ok: true };
  });
}
