const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('Connecting to cinora.ru...');
    await ssh.connect({
      host: 'cinora.ru',
      username: 'f0xyyy',
      password: 'N1k1t@_123'
    });
    console.log('Connected to server.');

    const projectDir = '/home/f0xyyy/cinora';

    console.log(`Uploading modified files to ${projectDir}...`);
    
    // upload page.tsx
    await ssh.putFile(
      path.join(__dirname, 'src', 'app', 'page.tsx'),
      `${projectDir}/src/app/page.tsx`
    );
    console.log('Uploaded src/app/page.tsx');

    console.log('Running sudo docker compose up -d --build...');
    
    const dockerRes = await ssh.execCommand(
      'echo "N1k1t@_123" | sudo -S docker compose up -d --build',
      { cwd: projectDir }
    );
    
    console.log(dockerRes.stdout);
    if (dockerRes.stderr) console.error("Stderr (docker):", dockerRes.stderr);

    console.log('Deployment completed successfully.');
    ssh.dispose();
  } catch (err) {
    console.error('Deployment Error:', err);
    ssh.dispose();
  }
}

deploy();
