const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: 'cinora.ru', username: 'f0xyyy', password: 'N1k1t@_123' });
  const script = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const excludedGenres = ['короткометражка', 'документальный', 'для-взрослых', 'ток-шоу', 'реальное-тв', 'мультфильм', 'детский', 'аниме'];
  const res = await prisma.movie.findMany({ 
      where: { 
        kinopoiskId: { not: null }, 
        rating: { gte: 7.5 }, 
        videoSources: { some: {} },
        genres: { none: { genre: { slug: { in: excludedGenres } } } }
      }, 
      orderBy: { rating: 'desc' }, 
      take: 100 
    });
  console.log("Top movies length:", res.length);
}
test().finally(() => prisma.$disconnect());
  `;
  await ssh.execCommand(`cat << 'EOF' > test-db.js\n${script}\nEOF`, { cwd: '/home/f0xyyy/cinora' });
  const res = await ssh.execCommand('echo "N1k1t@_123" | sudo -S docker exec -i cinora-app-1 node test-db.js', { cwd: '/home/f0xyyy/cinora' });
  console.log(res.stdout);
  if (res.stderr) console.error("Err:", res.stderr);
  ssh.dispose();
}
run();
