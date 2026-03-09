import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'GERENTE', 'VETERINARIO', 'VAQUEIRO', 'AUXILIAR', 'AUDITOR']).optional(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const user = await prisma.user.findUnique({ where: { email: body.email } });
      if (!user || !user.active) {
        return reply.status(401).send({ error: 'Credenciais inválidas' });
      }
      const valid = await bcrypt.compare(body.password, user.password);
      if (!valid) {
        return reply.status(401).send({ error: 'Credenciais inválidas' });
      }
      const token = app.jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        { expiresIn: '7d' }
      );
      return reply.status(200).send({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno';
      if (msg.includes('email') || msg.includes('Credenciais')) {
        return reply.status(401).send({ error: 'Credenciais inválidas' });
      }
      app.log.error(err);
      return reply.status(500).send({ error: 'Erro ao processar login. Tente novamente.' });
    }
  });

  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) {
      return reply.status(400).send({ error: 'Email já cadastrado' });
    }
    const hash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hash,
        name: body.name,
        role: (body.role as any) || 'VAQUEIRO',
      },
    });
    const token = app.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (request) => {
    const { sub } = (request as any).user;
    const user = await prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, email: true, name: true, role: true },
    });
    return user;
  });
}
