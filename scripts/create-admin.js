const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = "nrusakov079@gmail.com";
  const password = "N1k1t@_123";
  const name = "Admin";

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      password: hashedPassword
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log(`Successfully created/updated admin account for ${user.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
