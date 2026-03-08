import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema = z.object({
  propriedadeId: z.string().uuid(),
  nome: z.string().min(2, 'Nome é obrigatório (mín. 2 caracteres)'),
  areaHa: z.number().positive('Área é obrigatória e deve ser maior que zero'),
  especieForrageira: z.string().min(1, 'Espécie forrageira é obrigatória'),
  capacidadeSuporte: z.number().optional(),
  estadoConservacao: z.enum(['BOM', 'REGULAR', 'DEGRADADO', 'EM_REFORMA'], { errorMap: () => ({ message: 'Estado de conservação é obrigatório' }) }),
  bebedouro: z.boolean(),
  cochoParaSal: z.boolean(),
  adubado: z.boolean(),
  irrigado: z.boolean(),
  sistemaPastejo: z.enum(['CONTINUO', 'ROTACIONADO', 'VOISIN', 'FAIXA'], { errorMap: () => ({ message: 'Sistema de pastejo é obrigatório' }) }),
  poligono: z.any().refine((v) => v != null && typeof v === 'object' && v.type === 'Polygon', 'Perímetro geoespacial (polígono) é obrigatório'),
});

export async function piquetesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (req) => {
    const { propriedadeId } = req.query as { propriedadeId?: string };
    return prisma.piquete.findMany({
      where: propriedadeId ? { propriedadeId } : {},
      include: { _count: { select: { lotes: true } } },
      orderBy: { nome: 'asc' },
    });
  });

  app.get('/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.piquete.findUniqueOrThrow({ where: { id }, include: { lotes: true } });
  });

  app.post('/', async (req) => {
    const body = createSchema.parse(req.body);
    return prisma.piquete.create({ data: body });
  });

  app.patch('/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = createSchema.partial().parse(req.body);
    return prisma.piquete.update({ where: { id }, data: body });
  });

  app.delete('/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.piquete.delete({ where: { id } });
    return { ok: true };
  });
}
