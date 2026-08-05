import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.usuario.upsert({
    where: { email: 'admin@igreja.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@igreja.com',
      senha: passwordHash,
      role: 'ADMIN',
    },
  });

  const tribos = [
    { id: 'tribo-1', nome: 'Front', cor: '#FF6B6B' },
    { id: 'tribo-2', nome: 'Break', cor: '#4ECDC4' },
    { id: 'tribo-3', nome: 'Set', cor: '#45B7D1' },
    { id: 'tribo-4', nome: 'Drop', cor: '#FFA502' },
  ];

  for (const tribo of tribos) {
    await prisma.tribo.upsert({
      where: { id: tribo.id },
      update: {},
      create: {
        id: tribo.id,
        nome: tribo.nome,
        cor: tribo.cor,
        logo: null,
      },
    });
  }

  console.log('✅ Database seeded successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
