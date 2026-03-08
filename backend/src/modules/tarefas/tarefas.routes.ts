import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const tarefaSchema = z.object({
  propriedadeId: z.string().uuid(),
  funcionarioId: z.string().uuid().optional(),
  titulo: z.string(),
  descricao: z.string().optional(),
  dataPrevista: z.string(),
  prioridade: z.string().optional(),
});

export async function tarefasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (req) => {
    const { propriedadeId, funcionarioId, concluida } = req.query as { propriedadeId?: string; funcionarioId?: string; concluida?: string };
    const where: any = {};
    if (propriedadeId) where.propriedadeId = propriedadeId;
    if (funcionarioId) where.funcionarioId = funcionarioId;
    if (concluida !== undefined) where.concluida = concluida === 'true';
    return prisma.tarefa.findMany({
      where,
      include: { funcionario: { select: { nome: true } } },
      orderBy: { dataPrevista: 'asc' },
      take: 100,
    });
  });

  app.post('/', async (req) => {
    const body = tarefaSchema.parse(req.body);
    return prisma.tarefa.create({ data: { ...body, dataPrevista: new Date(body.dataPrevista) }, include: { funcionario: true } });
  });

  app.patch('/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = tarefaSchema.partial().parse(req.body);
    const data: any = { ...body };
    if (body.dataPrevista) data.dataPrevista = new Date(body.dataPrevista);
    if ('concluida' in (req.body as object)) data.concluida = (req.body as { concluida?: boolean }).concluida;
    if (data.concluida) data.dataConclusao = new Date();
    return prisma.tarefa.update({ where: { id }, data, include: { funcionario: true } });
  });

  app.delete('/:id', async (req) => {
    await prisma.tarefa.delete({ where: { id: (req.params as { id: string }).id } });
    return { ok: true };
  });
}
