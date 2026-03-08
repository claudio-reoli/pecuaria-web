/**
 * Script para importar pesagens a partir de CSV ou dados embutidos.
 *
 * Uso com CSV:
 *   npx tsx prisma/import-pesagens.ts <arquivo.csv>
 *
 * O CSV deve ter cabeçalho com colunas (nomes flexíveis):
 *   - Animal (ou Brinco) - identificador do animal
 *   - Data da Pesagem (ou Data Pesagem, Data) - formato DD/MM/AAAA
 *   - Peso (ou Peso (Kg)) - peso em kg (aceita vírgula ou ponto decimal)
 *
 * Exemplo de CSV:
 *   Animal,Data da Pesagem,Peso (Kg)
 *   81,01/01/2014,330
 *   82,25/03/2014,488
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Dados embutidos (usados quando nenhum arquivo é passado)
const DADOS_EMBED: { brinco: string; dataPesagem: string; peso: number }[] = [
  { brinco: '81', dataPesagem: '01/01/2014', peso: 330 },
  { brinco: '82', dataPesagem: '25/03/2014', peso: 488 },
  { brinco: '83', dataPesagem: '05/02/2014', peso: 1185 },
  { brinco: '84', dataPesagem: '09/04/2014', peso: 303 },
  { brinco: '85', dataPesagem: '16/01/2015', peso: 377 },
  { brinco: '86', dataPesagem: '01/01/2014', peso: 342 },
  { brinco: '87', dataPesagem: '01/01/2014', peso: 385 },
  { brinco: '88', dataPesagem: '25/03/2014', peso: 416 },
];

function parseDate(s: string): Date | null {
  if (!s?.trim()) return null;
  const cleaned = s.trim().replace(/-/g, '/');
  const [d, m, y] = cleaned.split(/[/\s]/);
  if (!d || !m || !y) return null;
  const year = parseInt(y, 10);
  const month = parseInt(m, 10) - 1;
  const day = parseInt(d, 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

function parsePeso(s: string): number | null {
  if (!s?.trim()) return null;
  const num = s.trim().replace(',', '.').replace(/\s/g, '');
  const n = parseFloat(num);
  return isNaN(n) ? null : n;
}

function lerCSV(arquivo: string): { brinco: string; dataPesagem: string; peso: number }[] {
  let conteudo = fs.readFileSync(arquivo, 'utf-8');
  if (conteudo.charCodeAt(0) === 0xfeff) conteudo = conteudo.slice(1);
  const linhas = conteudo.split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length < 2) return [];

  const header = linhas[0].split(/[,;\t]/).map((c) => c.trim().toLowerCase());
  const idxAnimal = header.findIndex((h) => /animal|brinco/i.test(h));
  const idxData = header.findIndex((h) => /data\s*(da)?\s*pesagem|data\s*pesagem|^data$/i.test(h));
  const idxPeso = header.findIndex((h) => /peso|peso\s*\(kg\)/i.test(h));

  if (idxAnimal < 0 || idxData < 0 || idxPeso < 0) {
    throw new Error(
      `CSV deve ter colunas Animal/Brinco, Data da Pesagem e Peso. Encontradas: ${header.join(', ')}`
    );
  }

  const sep = /[,;\t]/;
  const registros: { brinco: string; dataPesagem: string; peso: number }[] = [];

  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const brinco = (cols[idxAnimal] ?? '').trim();
    const dataStr = (cols[idxData] ?? '').trim();
    const pesoVal = parsePeso(cols[idxPeso] ?? '');

    if (!brinco || !dataStr || pesoVal == null || pesoVal <= 0) continue;

    const dataObj = parseDate(dataStr);
    if (!dataObj) continue;

    registros.push({
      brinco,
      dataPesagem: dataStr,
      peso: pesoVal,
    });
  }

  return registros;
}

async function importar(dados: { brinco: string; dataPesagem: string; peso: number }[]) {
  const prop = await prisma.propriedade.findFirst();
  if (!prop) {
    throw new Error('Nenhuma propriedade encontrada. Execute o seed primeiro.');
  }

  let criados = 0;
  let ignorados = 0;
  let erros = 0;

  for (const row of dados) {
    let animal = await prisma.animal.findFirst({
      where: {
        propriedadeId: prop.id,
        brinco: String(row.brinco),
      },
    });

    if (!animal) {
      try {
        animal = await prisma.animal.create({
          data: {
            propriedadeId: prop.id,
            brinco: String(row.brinco),
            especie: 'bovino',
            sexo: 'F',
            dataNascimento: new Date('2010-01-01'),
            categoria: 'VACA',
          },
        });
        console.log(`Animal "${row.brinco}" criado.`);
      } catch {
        console.warn(`Não foi possível criar animal "${row.brinco}" - linha ignorada.`);
        erros++;
        continue;
      }
    }

    const dataPes = parseDate(row.dataPesagem);
    if (!dataPes) {
      console.warn(`Data inválida para brinco ${row.brinco}: "${row.dataPesagem}"`);
      erros++;
      continue;
    }

    const existe = await prisma.pesagem.findFirst({
      where: {
        animalId: animal.id,
        data: dataPes,
      },
    });
    if (existe) {
      ignorados++;
      continue;
    }

    await prisma.pesagem.create({
      data: {
        animalId: animal.id,
        data: dataPes,
        peso: row.peso,
      },
    });
    criados++;
  }

  console.log(
    `Importação concluída: ${criados} pesagens inseridas${ignorados > 0 ? `, ${ignorados} duplicadas ignoradas` : ''}${erros > 0 ? `, ${erros} erros` : ''}.`
  );
}

async function main() {
  const arg = process.argv[2];
  let dados: { brinco: string; dataPesagem: string; peso: number }[];

  if (arg) {
    const caminho = path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
    if (!fs.existsSync(caminho)) {
      throw new Error(`Arquivo não encontrado: ${caminho}`);
    }
    console.log('Lendo CSV:', caminho);
    dados = lerCSV(caminho);
    console.log(`${dados.length} linhas válidas no CSV.`);
  } else {
    dados = DADOS_EMBED;
    console.log('Usando dados embutidos (nenhum arquivo informado).');
    console.log('Para importar CSV: npx tsx prisma/import-pesagens.ts <arquivo.csv>');
  }

  if (dados.length === 0) {
    console.log('Nenhum registro para importar.');
    return;
  }

  await importar(dados);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
