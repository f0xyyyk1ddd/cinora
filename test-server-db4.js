const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: 'cinora.ru', username: 'f0xyyy', password: 'N1k1t@_123' });
  const script = `
const { PrismaClient } = require('/app/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const excludedGenres = ['короткометражка', 'документальный', 'для-взрослых', 'ток-шоу', 'реальное-тв', 'мультфильм', 'детский', 'аниме'];
  
  const raw = await prisma.movie.findMany({ 
    where: { kinopoiskId: { not: null }, rating: { gte: 7.0 }, videoSources: { some: {} } }, 
    orderBy: { rating: 'desc' }, 
    take: 1000,
    select: { 
      id: true, title: true, rating: true, 
      genres: { select: { genre: { select: { slug: true } } } } 
    }
  });

  const isValidContent = (item) => {
    if (!item.genres) return true;
    return !item.genres.some((g) => excludedGenres.includes(g.genre?.slug));
  }
  
  const filtered = raw.filter(isValidContent);
  console.log("Raw fetched:", raw.length);
  console.log("Filtered count:", filtered.length);
  if (filtered.length > 0) {
     console.log("Top 5 normal movies:", filtered.slice(0, 5).map(m => m.title + ' (' + m.rating + ')'));
  }
}
test().finally(() => prisma.$disconnect());
  `;
  await ssh.execCommand(`cat << 'EOF' > /home/f0xyyy/cinora/test-db4.js\n${script}\nEOF`);
  const res2 = await ssh.execCommand('echo "N1k1t@_123" | sudo -S docker exec -i cinora-app-1 node /app/test-db4.js');
  
  // Actually, I can't run the script inside /app/test-db4.js because I saved it in /home/f0xyyy/cinora/test-db4.js!
  // I must copy it inside the docker container first:
  await ssh.execCommand('echo "N1k1t@_123" | sudo -S docker cp /home/f0xyyy/cinora/test-db4.js cinora-app-1:/app/test-db4.js');
  const res3 = await ssh.execCommand('echo "N1k1t@_123" | sudo -S docker exec -i cinora-app-1 node /app/test-db4.js');
  
  console.log("OUT:", res3.stdout);
  if (res3.stderr) console.error("ERR:", res3.stderr);
  ssh.dispose();
}
run();
