/**
 * Script para migrar animais a partir de CSV.
 * Uso: npx tsx prisma/migrate-animais.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CSV_DATA = `Brinco,Nome,Raça 1,G.S.,Sexo,Data de Nasc.,Pai,Mãe,Lote
9,9,Nelore,,Fêmea,01/01/2021,,,
20,6,Nelore,,Fêmea,01/01/2021,,,
22,22,Girolando,,Macho,01/01/2022,,,
27,27,Girolando,,Macho,01/02/2022,,,
28,28,Nelore,,Fêmea,01/01/2021,,,
30,30,Girolando,,Fêmea,01/01/2022,,,
31,31,Nelore,,Fêmea,01/01/2021,,,
32,32,Girolando,,Fêmea,01/01/2022,,,
37,37,Girolando,,Fêmea,01/01/2021,,,
38,38,Nelore PA,,Fêmea,16/06/2024,MIRANDA,78,
39,39,Girolando,,Macho,01/01/2022,,,
40,40,Nelore PA,,Fêmea,01/01/2021,,,
41,41,Nelore PA,,Fêmea,01/01/2021,,,
42,42,Nelore PA,,Fêmea,01/01/2021,,,
44,44,Nelore PA,,Fêmea,01/01/2021,,,
45,45,Nelore PA,,Fêmea,01/02/2021,,,
46,46,Nelore PA,,Fêmea,01/01/2021,,,
47,47,Nelore PA,,Fêmea,01/01/2021,,,
48,48,Nelore PA,,Fêmea,01/02/2021,,,
49,49,Nelore PA,,Fêmea,01/01/2021,,,
50,50,Nelore PA,,Macho,26/11/2024,MIRANDA,73,
51,51,Nelore PA,,Macho,21/10/2024,MIRANDA,91,
52,52,Nelore PA,,Fêmea,16/07/2024,MIRANDA,72,
53,53,Nelore PA,,Fêmea,16/11/2024,MIRANDA,92,
54,54,Nelore PA,,Fêmea,16/11/2024,MIRANDA,61,
55,55,Nelore PA,,Macho,05/11/2024,MIRANDA,48,
56,56,Nelore PA,,Fêmea,05/11/2024,MIRANDA,49,
57,57,Nelore PA,,Fêmea,28/11/2024,MIRANDA,20,
58,58,Nelore 1/2,,Fêmea,24/11/2024,17,9,
59,59,Nelore,,Macho,24/10/2025,MIRANDA,75,
60,60,Nelore PA,,Fêmea,15/01/2021,,,
61,61,Nelore PA,,Fêmea,01/01/2021,,,
63,63,Nelore PA,,Fêmea,01/01/2021,,,
64,64,Nelore PA,,Fêmea,01/01/2021,,,
65,65,Nelore PA,,Macho,15/08/2025,MIRANDA,71,
66,66,Nelore 1/2,,Macho,09/11/2025,MIRANDA,42,
67,67,Nelore PA,,Fêmea,14/12/2024,MIRANDA,47,
70,70,Nelore PA,,Macho,01/05/2024,MIRANDA,80,
71,71,Nelore PA,,Fêmea,01/01/2021,,,
72,72,Nelore PA,,Fêmea,01/01/2021,,,
73,73,Nelore PA,,Fêmea,01/01/2021,,,
74,74,Nelore PA,,Fêmea,01/01/2021,,,
75,75,Nelore PA,,Fêmea,01/01/2021,,,
76,76,Nelore PA,,Macho,17/12/2023,MIRANDA,60,
77,77,Nelore PA,,Macho,01/03/2024,MIRANDA,44,
78,78,Nelore PA,,Fêmea,01/01/2021,,,
79,MIRANDA,Nelore PO,,Macho (T),18/09/2020,,,
80,80,Nelore 1/2,,Fêmea,03/05/2021,,,
82,82,Nelore 1/2,,Fêmea,31/07/2025,MIRANDA,28,
86,86,Nelore 1/2,,Macho,13/11/2025,MIRANDA,63,
87,87,Nelore,,Fêmea,27/10/2025,MIRANDA,60,
90,90,Girolando,,Fêmea,01/01/2021,,,
91,91,Nelore,,Fêmea,01/01/2021,,,
92,70,Nelore PA,,Fêmea,01/01/2021,,,
95,95,Nelore 1/2,,Macho,13/11/2025,MIRANDA,41,
96,96,Nelore 1/2,,Fêmea,01/11/2025,MIRANDA,64,
97,97,Nelore 1/2,,Macho,05/11/2025,MIRANDA,78,
333,333,Girolando,,Fêmea,01/02/2023,,,
636363,636363,Nelore 1/2,,Fêmea,20/10/2025,,,
646464,646464,Nelore 1/2,,Fêmea,18/10/2025,MIRANDA,31,`;

function parseDate(s: string): Date | null {
  if (!s?.trim()) return null;
  const [d, m, y] = s.trim().split('/');
  if (!d || !m || !y) return null;
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return isNaN(date.getTime()) ? null : date;
}

function sexoMap(v: string): 'M' | 'F' | 'M_CASTRADO' {
  const s = (v || '').toLowerCase();
  if (s.includes('macho') && s.includes('t')) return 'M_CASTRADO';
  if (s.includes('fêmea') || s.includes('femea')) return 'F';
  return 'M';
}

function categorizar(sexo: 'M' | 'F' | 'M_CASTRADO', dataNasc: Date): string {
  const hoje = new Date();
  const anos = (hoje.getTime() - dataNasc.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (sexo === 'F') {
    if (anos < 1) return 'BEZERRA';
    if (anos < 2) return 'NOVILHA';
    return 'VACA';
  }
  if (sexo === 'M' || sexo === 'M_CASTRADO') {
    if (anos < 1) return sexo === 'M_CASTRADO' ? 'BOI' : 'BEZERRO';
    if (anos < 2) return sexo === 'M_CASTRADO' ? 'BOI' : 'NOVILHO';
    return sexo === 'M_CASTRADO' ? 'BOI' : 'TOURO';
  }
  return 'VACA';
}

async function main() {
  const linhas = CSV_DATA.trim().split('\n');
  const [header, ...rows] = linhas;
  if (!header?.toLowerCase().includes('brinco')) {
    console.error('CSV inválido');
    process.exit(1);
  }

  let prop = await prisma.propriedade.findFirst();
  if (!prop) {
    prop = await prisma.propriedade.create({
      data: { nome: 'Fazenda', areaTotal: 1000 },
    });
    console.log('Propriedade criada:', prop.nome);
  }

  let lote = await prisma.lote.findFirst({ where: { propriedadeId: prop.id } });
  if (!lote) {
    lote = await prisma.lote.create({
      data: { propriedadeId: prop.id, nome: 'Lote Principal', categoria: 'NOVILHA' },
    });
    console.log('Lote criado:', lote.nome);
  }

  const racasUsadas = new Set<string>();
  const registros: Array<{
    brinco: string;
    nome: string;
    raca: string;
    grauSangue: string;
    sexo: 'M' | 'F' | 'M_CASTRADO';
    dataNasc: string;
    paiRef: string;
    maeRef: string;
    loteRef: string;
  }> = [];

  for (const linha of rows) {
    const [brinco, nome, raca, gs, sexoStr, dataNascStr, paiRef, maeRef, loteRef] = linha.split(',').map((c) => c?.trim() ?? '');
    if (!brinco) continue;
    const sexo = sexoMap(sexoStr);
    const dataNasc = parseDate(dataNascStr);
    if (!dataNasc) {
      console.warn('Data inválida para brinco', brinco, '- ignorado');
      continue;
    }
    racasUsadas.add(raca || 'Outros');
    registros.push({
      brinco,
      nome: nome || brinco,
      raca: raca || 'Outros',
      grauSangue: gs || '',
      sexo,
      dataNasc: dataNascStr,
      paiRef: paiRef || '',
      maeRef: maeRef || '',
      loteRef: loteRef || '',
    });
  }

  for (const r of racasUsadas) {
    if (!r) continue;
    await prisma.raca.upsert({ where: { nome: r }, update: {}, create: { nome: r } });
  }
  console.log('Raças garantidas:', [...racasUsadas].length);

  const brincoToId = new Map<string, string>();
  const hoje = new Date();

  for (const r of registros) {
    const dataNasc = parseDate(r.dataNasc)!;
    const categoria = categorizar(r.sexo, dataNasc);

    const existente = await prisma.animal.findFirst({
      where: { propriedadeId: prop!.id, brinco: r.brinco },
    });
    if (existente) {
      brincoToId.set(r.brinco, existente.id);
      console.log('Animal já existe, pulando:', r.brinco);
      continue;
    }

    const animal = await prisma.animal.create({
      data: {
        propriedadeId: prop!.id,
        brinco: r.brinco,
        apelido: r.nome,
        raca: r.raca,
        grauSangue: r.grauSangue || null,
        sexo: r.sexo,
        categoria,
        dataNascimento: dataNasc,
        tipoOrigem: 'NASCIMENTO',
        loteId: lote!.id,
        nomePai: r.paiRef || null,
        nomeMae: r.maeRef || null,
        ativo: true,
        especie: 'bovino',
      },
    });
    brincoToId.set(r.brinco, animal.id);
  }
  console.log('Animais criados:', brincoToId.size);

  for (const r of registros) {
    if (!r.paiRef && !r.maeRef) continue;
    const animalId = brincoToId.get(r.brinco);
    if (!animalId) continue;

    let paiId: string | null = null;
    let maeId: string | null = null;

    if (r.paiRef) {
      paiId = brincoToId.get(r.paiRef) ?? null;
      if (!paiId) {
        const paiPorApelido = await prisma.animal.findFirst({
          where: { propriedadeId: prop!.id, apelido: r.paiRef },
        });
        paiId = paiPorApelido?.id ?? null;
      }
    }
    if (r.maeRef) {
      maeId = brincoToId.get(r.maeRef) ?? null;
    }

    if (paiId || maeId) {
      await prisma.animal.update({
        where: { id: animalId },
        data: { ...(paiId && { paiId }), ...(maeId && { maeId }) },
      });
    }
  }
  console.log('Referências Pai/Mãe atualizadas.');
  console.log('Migração concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
