const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: 'cinora.ru', username: 'f0xyyy', password: 'N1k1t@_123' });
  const script = `
const { PrismaClient } = require('/app/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const c1 = await prisma.movie.count();
  console.log("Total movies in db:", c1);
}
test().finally(() => prisma.$disconnect());
  `;
  await ssh.execCommand(`cat << 'EOF' > /home/f0xyyy/cinora/test-db5.js\n${script}\nEOF`);
  await ssh.execCommand('echo "N1k1t@_123" | sudo -S docker cp /home/f0xyyy/cinora/test-db5.js cinora-app-1:/app/test-db5.js');
  const res = await ssh.execCommand('echo "N1k1t@_123" | sudo -S docker exec -i cinora-app-1 sh -c "export DATABASE_URL=file:/app/data/dev.db && node /app/test-db5.js"');
  console.log("OUT:", res.stdout);
  ssh.dispose();
}
run();
