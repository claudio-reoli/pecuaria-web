import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const receitaSchema = z.object({ propriedadeId: z.string().uuid(), data: z.string(), valor: z.number(), categoria: z.string(), descricao: z.string().optional() });
const despesaSchema = z.object({ propriedadeId: z.string().uuid(), data: z.string(), valor: z.number(), categoria: z.string(), descricao: z.string().optional() });

export async function financeiroRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/receitas', async (req) => {
    const { propriedadeId, desde, ate } = req.query as { propriedadeId?: string; desde?: string; ate?: string };
    const where: any = propriedadeId ? { propriedadeId } : {};
    if (desde || ate) { where.data = {}; if (desde) where.data.gte = new Date(desde); if (ate) where.data.lte = new Date(ate); }
    return prisma.receita.findMany({ where, orderBy: { data: 'desc' }, take: 200 });
  });

  app.post('/receitas', async (req) => {
    const body = receitaSchema.parse(req.body);
    return prisma.receita.create({ data: { ...body, data: new Date(body.data) } });
  });

  app.patch('/receitas/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = receitaSchema.partial().parse(req.body);
    const data: any = { ...body };
    if (body.data) data.data = new Date(body.data);
    return prisma.receita.update({ where: { id }, data });
  });

  app.delete('/receitas/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.receita.delete({ where: { id } });
    return { ok: true };
  });

  app.get('/despesas', async (req) => {
    const { propriedadeId, desde, ate } = req.query as { propriedadeId?: string; desde?: string; ate?: string };
    const where: any = propriedadeId ? { propriedadeId } : {};
    if (desde || ate) { where.data = {}; if (desde) where.data.gte = new Date(desde); if (ate) where.data.lte = new Date(ate); }
    return prisma.despesa.findMany({ where, orderBy: { data: 'desc' }, take: 200 });
  });

  app.post('/despesas', async (req) => {
    const body = despesaSchema.parse(req.body);
    return prisma.despesa.create({ data: { ...body, data: new Date(body.data) } });
  });

  app.patch('/despesas/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = despesaSchema.partial().parse(req.body);
    const data: any = { ...body };
    if (body.data) data.data = new Date(body.data);
    return prisma.despesa.update({ where: { id }, data });
  });

  app.delete('/despesas/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.despesa.delete({ where: { id } });
    return { ok: true };
  });

  app.get('/dre', async (req) => {
    const { propriedadeId, mes, ano } = req.query as { propriedadeId: string; mes?: string; ano?: string };
    const start = ano && mes ? new Date(+ano, +mes - 1, 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = new Date(start); end.setMonth(end.getMonth() + 1); end.setDate(0);
    const where = { propriedadeId, data: { gte: start, lte: end } };
    const [receitas, despesas] = await Promise.all([
      prisma.receita.aggregate({ where, _sum: { valor: true } }),
      prisma.despesa.aggregate({ where, _sum: { valor: true } }),
    ]);
    const totalReceitas = receitas._sum.valor ?? 0;
    const totalDespesas = despesas._sum.valor ?? 0;
    return { totalReceitas, totalDespesas, resultado: totalReceitas - totalDespesas, periodo: { inicio: start, fim: end } };
  });
}
