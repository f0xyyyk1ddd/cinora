const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function run() {
  await ssh.connect({ host: 'cinora.ru', username: 'f0xyyy', password: 'N1k1t@_123' });
  await ssh.putFile('./debug-db.js', '/home/f0xyyy/cinora/debug-db.js');
  await ssh.execCommand('echo "N1k1t@_123" | sudo -S docker cp /home/f0xyyy/cinora/debug-db.js cinora-app-1:/app/debug-db.js');
  const res = await ssh.execCommand('echo "N1k1t@_123" | sudo -S docker exec -i cinora-app-1 node /app/debug-db.js');
  console.log("OUT:", res.stdout);
  if (res.stderr) console.error("ERR:", res.stderr);
  ssh.dispose();
}
run();
