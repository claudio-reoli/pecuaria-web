import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config.js';
import { prisma } from './lib/prisma.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { animaisRoutes } from './modules/animais/animais.routes.js';
import { lotesRoutes } from './modules/lotes/lotes.routes.js';
import { pesagemRoutes } from './modules/pesagem/pesagem.routes.js';
import { reproducaoRoutes } from './modules/reproducao/reproducao.routes.js';
import { sanidadeRoutes } from './modules/sanidade/sanidade.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { propriedadeRoutes } from './modules/propriedade/propriedade.routes.js';
import { iaRoutes } from './modules/ia/ia.routes.js';
import { financeiroRoutes } from './modules/financeiro/financeiro.routes.js';
import { piquetesRoutes } from './modules/piquetes/piquetes.routes.js';
import { movimentacaoRoutes } from './modules/movimentacao/movimentacao.routes.js';
import { patrimonioRoutes } from './modules/patrimonio/patrimonio.routes.js';
import { funcionariosRoutes } from './modules/funcionarios/funcionarios.routes.js';
import { tarefasRoutes } from './modules/tarefas/tarefas.routes.js';
import { racasRoutes } from './modules/racas/racas.routes.js';
import { configRoutes } from './modules/config/config.routes.js';
import { fornecedoresRoutes } from './modules/fornecedores/fornecedores.routes.js';
import fastifyStatic from '@fastify/static';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(jwt, { secret: config.jwtSecret });

app.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Não autorizado' });
  }
});

app.register(authRoutes, { prefix: '/api/auth' });
app.register(propriedadeRoutes, { prefix: '/api/propriedades' });
app.register(animaisRoutes, { prefix: '/api/animais' });
app.register(lotesRoutes, { prefix: '/api/lotes' });
app.register(pesagemRoutes, { prefix: '/api/pesagens' });
app.register(reproducaoRoutes, { prefix: '/api/reproducao' });
app.register(sanidadeRoutes, { prefix: '/api/sanidade' });
app.register(dashboardRoutes, { prefix: '/api/dashboard' });
app.register(iaRoutes, { prefix: '/api/ia' });
app.register(financeiroRoutes, { prefix: '/api/financeiro' });
app.register(piquetesRoutes, { prefix: '/api/piquetes' });
app.register(movimentacaoRoutes, { prefix: '/api/movimentacoes' });
app.register(patrimonioRoutes, { prefix: '/api/patrimonio' });
app.register(funcionariosRoutes, { prefix: '/api/funcionarios' });
app.register(tarefasRoutes, { prefix: '/api/tarefas' });
app.register(racasRoutes, { prefix: '/api/racas' });
app.register(configRoutes, { prefix: '/api/config' });
app.register(fornecedoresRoutes, { prefix: '/api/fornecedores' });

app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  await app.register(fastifyStatic, { root: frontendDist });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api')) return reply.status(404).send({ error: 'Not found' });
    return reply.sendFile('index.html');
  });
  app.log.info({ path: frontendDist }, 'Servindo frontend');
} else {
  app.log.warn({ path: frontendDist }, 'Frontend dist não encontrado - rode "npm run build -w frontend"');
}

const start = async () => {
  try {
    await prisma.$connect();
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Backend rodando em http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
