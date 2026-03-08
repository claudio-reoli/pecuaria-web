/**
 * Script para importar movimentações a partir dos dados fornecidos.
 * Uso: npx tsx prisma/import-movimentacoes.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dados da imagem: Brinco, Data, Motivo, Causa, Observação
const DADOS = [
  { brinco: '17', data: '03/02/2025', motivo: 'venda', causa: 'abate', observacao: '' },
  { brinco: '18', data: '28/05/2025', motivo: 'venda', causa: 'abate', observacao: 'Vendido pra Deca' },
  { brinco: '19', data: '26/09/2024', motivo: 'venda', causa: 'abate', observacao: 'Pesou 11@ no abate (1.980,00)' },
  { brinco: '21', data: '05/06/2024', motivo: 'venda', causa: 'abate', observacao: 'Pesou 8,3@ no abate (1.500,00)' },
  { brinco: '24', data: '03/02/2025', motivo: 'venda', causa: 'abate', observacao: 'Pesou 12@ no abate (2.160,00)' },
  { brinco: '29', data: '28/05/2025', motivo: 'venda', causa: 'abate', observacao: 'Pesou 9,7@ no abate (1.752,00)' },
  { brinco: '33', data: '26/09/2024', motivo: 'venda', causa: 'abate', observacao: 'Pesou 8,7@ no abate (1.572,00)' },
  { brinco: '62', data: '05/06/2024', motivo: 'venda', causa: 'abate', observacao: 'Vendido para Levi' },
  { brinco: '68', data: '03/02/2025', motivo: 'morte', causa: 'morte indefinida', observacao: '' },
  { brinco: '81', data: '28/05/2025', motivo: 'venda', causa: 'abate', observacao: '' },
  { brinco: '93', data: '26/09/2024', motivo: 'venda', causa: 'abate', observacao: '' },
  { brinco: '94', data: '05/06/2024', motivo: 'venda', causa: 'abate', observacao: '' },
  { brinco: 'sem brinco1', data: '03/02/2025', motivo: 'morte', causa: 'desnutrição', observacao: 'A bezerra não mamou o colostro e definhou' },
  { brinco: 'sem brinco', data: '28/05/2025', motivo: 'morte', causa: 'desnutrição', observacao: '' },
];

function parseDate(s: string): Date {
  const [d, m, y] = s.trim().split('/');
  return new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
}

async function main() {
  const prop = await prisma.propriedade.findFirst();
  if (!prop) {
    throw new Error('Nenhuma propriedade encontrada. Execute o seed primeiro.');
  }

  let loteSaida = await prisma.lote.findFirst({
    where: { propriedadeId: prop.id, nome: 'Saída' },
  });
  if (!loteSaida) {
    loteSaida = await prisma.lote.create({
      data: {
        propriedadeId: prop.id,
        nome: 'Saída',
        categoria: 'BOI',
      },
    });
    console.log('Lote "Saída" criado.');
  }

  let criados = 0;
  let ignorados = 0;

  for (const row of DADOS) {
    let animal = await prisma.animal.findFirst({
      where: {
        propriedadeId: prop.id,
        brinco: row.brinco,
      },
    });

    if (!animal) {
      const novoAnimal = await prisma.animal.create({
        data: {
          propriedadeId: prop.id,
          brinco: row.brinco,
          especie: 'bovino',
          sexo: 'F',
          dataNascimento: new Date('2020-01-01'),
          categoria: 'VACA',
        },
      });
      console.log(`Animal "${row.brinco}" criado (ID: ${novoAnimal.id})`);

      await prisma.movimentacao.create({
        data: {
          animalId: novoAnimal.id,
          loteDestinoId: loteSaida.id,
          data: parseDate(row.data),
          motivo: row.motivo,
          causa: row.causa || undefined,
          observacao: row.observacao || undefined,
        },
      });
      await prisma.animal.update({
        where: { id: novoAnimal.id },
        data: {
          loteId: loteSaida.id,
          ativo: false,
          motivoBaixa: row.motivo === 'morte' ? 'MORTE' : 'VENDA',
          dataBaixa: parseDate(row.data),
        },
      });
      criados++;
    } else {
      const existe = await prisma.movimentacao.findFirst({
        where: {
          animalId: animal.id,
          data: parseDate(row.data),
          motivo: row.motivo,
        },
      });
      if (existe) {
        ignorados++;
        continue;
      }

      await prisma.movimentacao.create({
        data: {
          animalId: animal.id,
          loteDestinoId: loteSaida.id,
          data: parseDate(row.data),
          motivo: row.motivo,
          causa: row.causa || undefined,
          observacao: row.observacao || undefined,
        },
      });
      await prisma.animal.update({
        where: { id: animal.id },
        data: {
          loteId: loteSaida.id,
          ativo: false,
          motivoBaixa: row.motivo === 'morte' ? 'MORTE' : 'VENDA',
          dataBaixa: parseDate(row.data),
        },
      });
      criados++;
    }
  }

  console.log(`Importação concluída: ${criados} movimentações inseridas${ignorados > 0 ? `, ${ignorados} duplicadas ignoradas` : ''}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
