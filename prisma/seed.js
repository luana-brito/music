const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

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
    { id: 'tribo-1', nome: 'Front', cor: '#F43F5E' },
    { id: 'tribo-2', nome: 'Break', cor: '#22D3EE' },
    { id: 'tribo-3', nome: 'Set', cor: '#60A5FA' },
    { id: 'tribo-4', nome: 'Drop', cor: '#F472B6' },
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

  console.log('Database seeded successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
