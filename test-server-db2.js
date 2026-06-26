const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: 'cinora.ru', username: 'f0xyyy', password: 'N1k1t@_123' });
  const script = `
const { PrismaClient } = require('/app/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const excludedGenres = ['короткометражка', 'документальный', 'для-взрослых', 'ток-шоу', 'реальное-тв'];
  
  const c1 = await prisma.movie.count({ where: { kinopoiskId: { not: null }, rating: { gte: 7.5 }, videoSources: { some: {} } } });
  console.log("Total >= 7.5 with video:", c1);
  
  const c2 = await prisma.movie.count({ 
    where: { 
      kinopoiskId: { not: null }, 
      rating: { gte: 7.5 }, 
      videoSources: { some: {} },
      genres: { none: { genre: { slug: { in: excludedGenres } } } }
    }
  });
  console.log("Total >= 7.5 with video (filtered):", c2);
  
  const c3 = await prisma.movie.count({
    where: { videoSources: { some: {} } }
  });
  console.log("Total with video:", c3);
}
test().finally(() => prisma.$disconnect());
  `;
  await ssh.execCommand(`cat << 'EOF' > /home/f0xyyy/cinora/test-db2.js\n${script}\nEOF`);
  const res = await ssh.execCommand('echo "N1k1t@_123" | sudo -S docker exec -i cinora-app-1 node /app/test-db2.js');
  // wait, the script is in /home/f0xyyy/cinora, but docker container maps /app to where? It's a standalone build, so it doesn't map the volume!
  // It copies files into the image! So /home/f0xyyy/cinora/test-db2.js is NOT in the container.
  // We can pipe it!
  const res2 = await ssh.execCommand('echo "N1k1t@_123" | sudo -S docker exec -i cinora-app-1 node -e "' + script.replace(/"/g, '\\"').replace(/\n/g, ' ') + '"');
  
  console.log("OUT:", res2.stdout);
  console.log("ERR:", res2.stderr);
  ssh.dispose();
}
run();
