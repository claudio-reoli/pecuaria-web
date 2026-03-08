import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const baseSchema = z.object({
  propriedadeId: z.string().uuid(),
  brinco: z.string().min(1),
  brincoEid: z.string().optional(),
  apelido: z.string().min(1, 'Apelido é obrigatório'),
  especie: z.string().default('bovino'),
  raca: z.string().min(1, 'Raça é obrigatória'),
  grauSangue: z.string().min(1, 'Grau de sangue é obrigatório'),
  sexo: z.enum(['M', 'F', 'M_CASTRADO']),
  categoria: z.enum(['BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI']),
  dataNascimento: z.string().min(10, 'Data de nascimento é obrigatória'),
  pesoAoNascer: z.number().optional(),
  pelagem: z.string().optional(),
  origem: z.string().optional(),
  tipoOrigem: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['NASCIMENTO', 'COMPRA', 'TRANSFERENCIA']).optional()),
  dataEntrada: z.string().optional(),
  propriedadeOrigem: z.string().optional(),
  valorAquisicao: z.number().optional(),
  numeroSISBOV: z.string().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().optional(),
  piqueteId: z.string().uuid().optional(),
  paiId: z.string().uuid().optional(),
  maeId: z.string().uuid().optional(),
  nomePai: z.string().optional(),
  nomeMae: z.string().optional(),
  statusRegistro: z.string().optional(),
  numeroRegistro: z.string().optional(),
  loteId: z.string().uuid('Lote é obrigatório'),
});

const createSchema = baseSchema
  .refine((d) => ['NASCIMENTO', 'COMPRA', 'TRANSFERENCIA'].includes(d.tipoOrigem || ''), {
    message: 'Origem é obrigatória',
    path: ['tipoOrigem'],
  })
  .refine(
    (d) => !['COMPRA', 'TRANSFERENCIA'].includes(d.tipoOrigem || '') || (d.dataEntrada && d.dataEntrada.length >= 10),
    { message: 'Data da entrada é obrigatória quando a origem é Compra ou Transferência', path: ['dataEntrada'] }
  )
  .refine(
    (d) => !d.tipoOrigem || d.tipoOrigem !== 'NASCIMENTO' || (d.paiId && d.maeId),
    { message: 'Pai e mãe são obrigatórios para animais de nascimento', path: ['paiId'] }
  )
  .refine(
    (d) => !['COMPRA', 'TRANSFERENCIA'].includes(d.tipoOrigem || '') || (d.nomePai && String(d.nomePai).trim() && d.nomeMae && String(d.nomeMae).trim()),
    { message: 'Nome do pai e da mãe são obrigatórios para Compra ou Transferência', path: ['nomePai'] }
  )
  .refine(
    (d) => {
      if (!d.statusRegistro || d.statusRegistro === 'sem registro') return true;
      return (d.statusRegistro === 'RGN' || d.statusRegistro === 'RGD')
        ? (d.numeroRegistro && d.numeroRegistro.trim().length > 0)
        : true;
    },
    { message: 'Número do registro é obrigatório quando o status é RGN ou RGD', path: ['numeroRegistro'] }
  )
  .refine(
    (d) => !d.numeroSISBOV || !d.numeroSISBOV.trim() || /^\d{15}$/.test(String(d.numeroSISBOV).trim()),
    { message: 'O número SISBOV deve conter exatamente 15 dígitos numéricos', path: ['numeroSISBOV'] }
  );

const updateSchema = baseSchema.partial()
  .refine(
    (d) => !['COMPRA', 'TRANSFERENCIA'].includes(d.tipoOrigem || '') || (d.dataEntrada && String(d.dataEntrada).length >= 10),
    { message: 'Data da entrada é obrigatória quando a origem é Compra ou Transferência', path: ['dataEntrada'] }
  )
  .refine(
    (d) => !d.tipoOrigem || d.tipoOrigem !== 'NASCIMENTO' || (d.paiId && d.maeId),
    { message: 'Pai e mãe são obrigatórios para animais de nascimento', path: ['paiId'] }
  )
  .refine(
    (d) => !['COMPRA', 'TRANSFERENCIA'].includes(d.tipoOrigem || '') || (d.nomePai && String(d.nomePai).trim() && d.nomeMae && String(d.nomeMae).trim()),
    { message: 'Nome do pai e da mãe são obrigatórios para Compra ou Transferência', path: ['nomePai'] }
  )
  .refine(
    (d) => {
      if (!d.statusRegistro || d.statusRegistro === 'sem registro') return true;
      return (d.statusRegistro === 'RGN' || d.statusRegistro === 'RGD')
        ? (d.numeroRegistro && String(d.numeroRegistro).trim().length > 0)
        : true;
    },
    { message: 'Número do registro é obrigatório quando o status é RGN ou RGD', path: ['numeroRegistro'] }
  )
  .refine(
    (d) => !d.numeroSISBOV || !String(d.numeroSISBOV).trim() || /^\d{15}$/.test(String(d.numeroSISBOV).trim()),
    { message: 'O número SISBOV deve conter exatamente 15 dígitos numéricos', path: ['numeroSISBOV'] }
  );

export async function animaisRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (request) => {
    const q = request.query as { propriedadeId?: string; loteId?: string; search?: string };
    const where: any = {};
    if (q.propriedadeId) where.propriedadeId = q.propriedadeId;
    if (q.loteId) where.loteId = q.loteId;
    if (q.search) {
      where.OR = [
        { brinco: { contains: q.search, mode: 'insensitive' } },
        { brincoEid: { contains: q.search, mode: 'insensitive' } },
        { apelido: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    return prisma.animal.findMany({
      where,
      include: {
        lote: { select: { id: true, nome: true } },
        piquete: { select: { id: true, nome: true } },
      },
      orderBy: { brinco: 'asc' },
      take: 100,
    });
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return prisma.animal.findUniqueOrThrow({
      where: { id },
      include: {
        lote: true,
        piquete: true,
        pai: { select: { id: true, brinco: true, apelido: true } },
        mae: { select: { id: true, brinco: true, apelido: true } },
        pesagens: { orderBy: { data: 'desc' }, take: 10 },
        vacinacoes: { include: { medicamento: true }, orderBy: { data: 'desc' }, take: 5 },
      },
    });
  });

  app.post('/', async (request) => {
    const body = createSchema.parse(request.body);
    const data: any = {
      ...body,
      dataNascimento: body.dataNascimento ? new Date(body.dataNascimento as string) : undefined,
      dataEntrada: body.dataEntrada ? new Date(body.dataEntrada as string) : undefined,
      valorAquisicao: body.valorAquisicao ?? undefined,
      piqueteId: body.piqueteId || undefined,
    };
    return prisma.animal.create({ data });
  });

  app.patch('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = updateSchema.parse(request.body);
    const data = {
      ...body,
      dataNascimento: body.dataNascimento ? new Date(body.dataNascimento as string) : undefined,
      dataEntrada: body.dataEntrada ? new Date(body.dataEntrada as string) : undefined,
    };
    return prisma.animal.update({ where: { id }, data });
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.animal.delete({ where: { id } });
    return { ok: true };
  });
}
