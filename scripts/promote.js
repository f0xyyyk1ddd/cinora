const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log("No users found.");
    return;
  }
  
  for (const user of users) {
    if (user.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
      console.log(`Updated user ${user.email} to ADMIN`);
    } else {
      console.log(`User ${user.email} is already ADMIN`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
