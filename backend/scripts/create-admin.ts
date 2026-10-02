import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Error: Please provide ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      password_hash
    },
    create: {
      name: 'System Admin',
      email,
      password_hash,
      role: 'ADMIN'
    }
  });

  console.log(`Admin account provisioned for: ${admin.email}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
