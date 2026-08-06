const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const tribo = await prisma.tribo.findFirst({ orderBy: { nome: 'asc' } });
    if (!tribo) {
      console.log('no tribo found');
      return;
    }

    const existing = await prisma.musica.findFirst({ where: { nome: 'Demo Local' } });
    if (!existing) {
      await prisma.musica.create({
        data: {
          nome: 'Demo Local',
          ano: 2026,
          blobUrl: '/musicas/demo.wav',
          duracao: 1,
          triboId: tribo.id,
        },
      });
      console.log('music created');
    } else {
      console.log('music exists');
    }

    const count = await prisma.musica.count();
    console.log('count', count);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
