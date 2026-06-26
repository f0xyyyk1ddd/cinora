const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: 'cinora.ru', username: 'f0xyyy', password: 'N1k1t@_123' });
  const res = await ssh.execCommand('cat docker-compose.yml', { cwd: '/home/f0xyyy/cinora' });
  console.log(res.stdout);
  ssh.dispose();
}
run();
