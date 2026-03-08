import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    const hash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@pecuaria.com' },
        update: {},
        create: {
            email: 'admin@pecuaria.com',
            password: hash,
            name: 'Administrador',
            role: 'ADMIN',
        },
    });
    console.log('Admin criado:', admin.email);
    const prop = await prisma.propriedade.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            nome: 'Fazenda Modelo',
            areaTotal: 1000,
        },
    });
    console.log('Propriedade criada:', prop.nome);
    const racasBovinas = [
        'Nelore', 'Angus', 'Brahman', 'Brangus', 'Braford', 'Tabapuã', 'Guzerá',
        'Canchim', 'Hereford', 'Charolês', 'Simental', 'Shorthorn', 'Indubrasil',
        'Sindi', 'Girolando', 'Senepol', 'Caracu', 'Devon', 'Limousin', 'Marchigiana',
        'Mestiço', 'Outros',
    ];
    for (const nome of racasBovinas) {
        await prisma.raca.upsert({
            where: { nome },
            update: {},
            create: { nome },
        });
    }
    console.log('Raças de corte cadastradas:', racasBovinas.length);
    const lote = await prisma.lote.upsert({
        where: { id: '00000000-0000-0000-0000-000000000002' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000002',
            propriedadeId: prop.id,
            nome: 'Lote Principal',
            categoria: 'NOVILHA',
        },
    });
    console.log('Lote criado:', lote.nome);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
