const fs = require('fs');

async function restore() {
  const output = require('child_process').execSync('echo \\'N1k1t@_123\\' | sudo -S docker compose exec -T postgres psql -U root -d cinora -t -c "SELECT \\"kinopoiskId\\" FROM \\"Blacklist\\";"').toString();
  const ids = output.split('\n').map(id => id.trim()).filter(id => id.length > 0 && id !== 'kinopoiskId' && id !== '-----------' && id !== '(0 rows)');
  
  console.log(`Found ${ids.length} movies to restore.`);
  
  let restored = 0;
  for (const id of ids) {
    try {
      console.log(`Restoring ${id}...`);
      const res = await fetch('http://localhost:3000/api/admin/kinopoisk/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kinopoiskId: id })
      });
      if (res.ok) {
        restored++;
        require('child_process').execSync(`echo 'N1k1t@_123' | sudo -S docker compose exec -T postgres psql -U root -d cinora -c "DELETE FROM \\"Blacklist\\" WHERE \\"kinopoiskId\\" = ${id};"`);
      } else {
        console.log(`Failed to restore ${id}: ${await res.text()}`);
      }
    } catch (e) {
      console.error(`Error restoring ${id}:`, e.message);
    }
  }
  console.log(`Restored ${restored} out of ${ids.length} movies.`);
}
restore();
