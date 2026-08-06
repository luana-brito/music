const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const tribo = await prisma.tribo.findFirst({ orderBy: { nome: 'asc' } });
    if (!tribo) {
      console.log('no tribo found');
      return;
    }

    let musica = await prisma.musica.findFirst({ where: { nome: 'Demo Longa' } });
    if (!musica) {
      musica = await prisma.musica.create({
        data: {
          nome: 'Demo Longa',
          ano: 2026,
          blobUrl: '/musicas/demo8.wav',
          duracao: 8,
          triboId: tribo.id,
        },
      });
      console.log('created', musica.id);
    } else {
      console.log('exists', musica.id);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
