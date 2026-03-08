import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const CHAVE_MAPA = 'google_maps_api_key';

const updateSchema = z.object({
  googleMapsApiKey: z.string().optional(),
});

export async function configRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async () => {
    const config = await prisma.config.findMany({
      where: { chave: CHAVE_MAPA },
    });
    const row = config[0];
    return {
      googleMapsApiKey: row?.valor ?? '',
    };
  });

  app.patch('/', async (request) => {
    const body = updateSchema.parse(request.body);
    if (body.googleMapsApiKey !== undefined) {
      await prisma.config.upsert({
        where: { chave: CHAVE_MAPA },
        create: { chave: CHAVE_MAPA, valor: body.googleMapsApiKey || null },
        update: { valor: body.googleMapsApiKey || null },
      });
    }
    const row = await prisma.config.findUnique({
      where: { chave: CHAVE_MAPA },
    });
    return { googleMapsApiKey: row?.valor ?? '' };
  });
}
