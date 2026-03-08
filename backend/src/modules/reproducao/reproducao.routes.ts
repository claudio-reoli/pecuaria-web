import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const estacaoMontaSchema = z.object({
  propriedadeId: z.string().uuid(),
  nome: z.string().min(2),
  dataInicio: z.string().datetime().or(z.date()),
  dataFim: z.string().datetime().or(z.date()),
  loteFemeasId: z.string().uuid().optional(),
  piqueteId: z.string().uuid().optional(),
  razaoTouroVaca: z.number().optional(),
});

const diagnosticoSchema = z.object({
  estacaoMontaId: z.string().uuid(),
  animalId: z.string().uuid(),
  data: z.string().datetime().or(z.date()),
  resultado: z.enum(['prenha', 'vazia']),
  metodo: z.string().optional(),
  idadeGestacional: z.number().optional(),
  responsavel: z.string().optional(),
});

const partoSchema = z.object({
  maeId: z.string().uuid(),
  data: z.string().datetime().or(z.date()),
  hora: z.string().optional(),
  tipo: z.enum(['eutocico', 'distocico', 'cesariana']).optional(),
  sexoCria: z.enum(['M', 'F']),
  pesoAoNascer: z.number().optional(),
  escoreVitalidade: z.number().optional(),
  observacoes: z.string().optional(),
  criarCria: z.boolean().optional(),
  brincoCria: z.string().optional(),
});

export async function reproducaoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/estacoes', async (request) => {
    const { propriedadeId } = request.query as { propriedadeId?: string };
    return prisma.estacaoMonta.findMany({
      where: propriedadeId ? { propriedadeId } : {},
      include: { _count: { select: { diagnosticos: true } } },
      orderBy: { dataInicio: 'desc' },
    });
  });

  app.post('/estacoes', async (request) => {
    const body = estacaoMontaSchema.parse(request.body);
    return prisma.estacaoMonta.create({
      data: {
        ...body,
        dataInicio: new Date(body.dataInicio),
        dataFim: new Date(body.dataFim),
      },
    });
  });

  app.patch('/estacoes/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = estacaoMontaSchema.partial().parse(request.body);
    const data: any = { ...body };
    if (body.dataInicio) data.dataInicio = new Date(body.dataInicio);
    if (body.dataFim) data.dataFim = new Date(body.dataFim);
    return prisma.estacaoMonta.update({ where: { id }, data });
  });

  app.delete('/estacoes/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.estacaoMonta.delete({ where: { id } });
    return { ok: true };
  });

  app.get('/diagnosticos', async (request) => {
    const { estacaoMontaId } = request.query as { estacaoMontaId?: string };
    return prisma.diagnosticoGestacao.findMany({
      where: estacaoMontaId ? { estacaoMontaId } : {},
      include: { animal: { select: { id: true, brinco: true } } },
      orderBy: { data: 'desc' },
    });
  });

  app.post('/diagnosticos', async (request) => {
    const body = diagnosticoSchema.parse(request.body);
    const dpp = body.idadeGestacional
      ? new Date(new Date(body.data).getTime() + (282 - body.idadeGestacional) * 24 * 60 * 60 * 1000)
      : null;
    return prisma.diagnosticoGestacao.create({
      data: {
        ...body,
        data: new Date(body.data),
        dataPrevistaParto: dpp,
      },
      include: { animal: { select: { id: true, brinco: true } } },
    });
  });

  app.get('/partos', async (request) => {
    const { maeId } = request.query as { maeId?: string };
    return prisma.parto.findMany({
      where: maeId ? { maeId } : {},
      include: { mae: { select: { id: true, brinco: true } }, cria: { select: { id: true, brinco: true } } },
      orderBy: { data: 'desc' },
    });
  });

  app.patch('/partos/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = partoSchema.partial().parse(request.body);
    const data: any = { ...body };
    if (body.data) data.data = new Date(body.data);
    return prisma.parto.update({
      where: { id },
      data,
      include: { mae: true, cria: true },
    });
  });

  app.delete('/partos/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.parto.delete({ where: { id } });
    return { ok: true };
  });

  app.post('/partos', async (request) => {
    const body = partoSchema.parse(request.body);
    const mae = await prisma.animal.findUniqueOrThrow({ where: { id: body.maeId } });
    let criaId: string | undefined;
    if (body.criarCria && body.brincoCria) {
      const cria = await prisma.animal.create({
        data: {
          propriedadeId: mae.propriedadeId,
          brinco: body.brincoCria,
          sexo: body.sexCria as any,
          categoria: 'BEZERRO',
          origem: 'nascimento',
          maeId: body.maeId,
          dataNascimento: new Date(body.data),
          pesoAoNascer: body.pesoAoNascer,
        },
      });
      criaId = cria.id;
    }
    return prisma.parto.create({
      data: {
        maeId: body.maeId,
        data: new Date(body.data),
        hora: body.hora,
        tipo: body.tipo,
        sexoCria: body.sexCria as any,
        pesoAoNascer: body.pesoAoNascer,
        escoreVitalidade: body.escoreVitalidade,
        observacoes: body.observacoes,
        criaId,
      },
      include: { mae: true, cria: true },
    });
  });
}
