const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$executeRawUnsafe('ALTER TABLE WatchHistory ADD COLUMN seriesId TEXT;').then(() => {
  console.log('Successfully added seriesId column');
  process.exit(0);
}).catch(err => {
  console.error('Error adding column:', err);
  process.exit(1);
});
