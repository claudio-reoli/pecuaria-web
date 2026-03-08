import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';

export async function racasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async () => {
    return prisma.raca.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    });
  });
}
