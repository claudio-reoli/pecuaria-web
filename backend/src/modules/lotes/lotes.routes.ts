import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema = z.object({
  propriedadeId: z.string().uuid(),
  nome: z.string().min(2),
  categoria: z.enum(['BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI']),
  faseProdutiva: z.string().optional(),
  piqueteId: z.string().uuid().optional(),
  metaGMD: z.number().optional(),
  metaPesoAbate: z.number().optional(),
  dataFormacao: z.string().optional(),
  responsavel: z.string().optional(),
  ativo: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export async function lotesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (request) => {
    const { propriedadeId } = request.query as { propriedadeId?: string };
    return prisma.lote.findMany({
      where: propriedadeId ? { propriedadeId } : {},
      include: { piquete: true, _count: { select: { animais: true } } },
      orderBy: { nome: 'asc' },
    });
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return prisma.lote.findUniqueOrThrow({
      where: { id },
      include: { piquete: true, animais: true },
    });
  });

  app.post('/', async (request) => {
    const body = createSchema.parse(request.body);
    const data: any = { ...body };
    if (body.dataFormacao) data.dataFormacao = new Date(body.dataFormacao as string);
    return prisma.lote.create({ data });
  });

  app.patch('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = updateSchema.parse(request.body);
    const data: any = { ...body };
    if (body.dataFormacao) data.dataFormacao = new Date(body.dataFormacao as string);
    return prisma.lote.update({ where: { id }, data });
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.lote.delete({ where: { id } });
    return { ok: true };
  });
}
