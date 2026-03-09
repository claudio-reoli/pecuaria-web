import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads/manejo-sanitario');
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

export async function uploadRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.post('/imagem', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'Nenhum arquivo enviado' });
    }
    let buf = await data.toBuffer();
    const mime = data.mimetype || '';
    if (mime.startsWith('image/') && buf.length > MAX_SIZE_BYTES) {
      try {
        let quality = 80;
        let result = await sharp(buf)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality })
          .toBuffer();
        while (result.length > MAX_SIZE_BYTES && quality > 30) {
          quality -= 15;
          result = await sharp(buf)
            .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality })
            .toBuffer();
        }
        if (result.length > MAX_SIZE_BYTES) {
          return reply.status(400).send({ error: 'Imagem muito grande. Máximo 3MB. Tente uma foto com menor resolução.' });
        }
        buf = result;
      } catch {
        return reply.status(400).send({ error: 'Formato de imagem inválido.' });
      }
    } else if (buf.length > MAX_SIZE_BYTES) {
      return reply.status(400).send({ error: 'Arquivo muito grande. Máximo 3MB.' });
    }
    return saveAndReturn(buf, data.filename, mime, reply);
  });
}

async function saveAndReturn(buffer: Buffer, filename: string, mime: string, reply: any) {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  const ext = mime.includes('png') ? '.png' : '.jpg';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filepath = path.join(UPLOAD_DIR, name);
  fs.writeFileSync(filepath, buffer);
  const url = `/uploads/manejo-sanitario/${name}`;
  return reply.send({ url });
}
