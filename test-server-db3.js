const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: 'cinora.ru', username: 'f0xyyy', password: 'N1k1t@_123' });
  const script = `
const { PrismaClient } = require('/app/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const excludedGenres = ['короткометражка', 'документальный', 'для-взрослых', 'ток-шоу', 'реальное-тв', 'мультфильм', 'детский', 'аниме'];
  
  const topKinopoiskMoviesRaw = await prisma.movie.findMany({ 
    where: { kinopoiskId: { not: null }, rating: { gte: 7.0 }, videoSources: { some: {} } }, 
    orderBy: { rating: 'desc' }, 
    take: 200,
    include: { genres: { include: { genre: true } } }
  });

  const isValidContent = (item) => {
    if (!item.genres) return true;
    return !item.genres.some((g) => excludedGenres.includes(g.genre?.slug));
  }
  
  const filtered = topKinopoiskMoviesRaw.filter(isValidContent);
  console.log("Raw count:", topKinopoiskMoviesRaw.length);
  console.log("Filtered count:", filtered.length);
  if (topKinopoiskMoviesRaw.length > 0) {
     console.log("First item genres:", topKinopoiskMoviesRaw[0].genres.map(g => g.genre?.slug));
  }
}
test().finally(() => prisma.$disconnect());
  `;
  await ssh.execCommand(`cat << 'EOF' > /home/f0xyyy/cinora/test-db3.js\n${script}\nEOF`);
  const res2 = await ssh.execCommand('echo "N1k1t@_123" | sudo -S docker exec -i cinora-app-1 node -e "' + script.replace(/"/g, '\\"').replace(/\n/g, ' ') + '"');
  
  console.log("OUT:", res2.stdout);
  console.log("ERR:", res2.stderr);
  ssh.dispose();
}
run();
