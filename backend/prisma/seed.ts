// Seed minimal roles (USER, STAFF, ADMIN) and a client app for staff login.
// Run with: npx ts-node prisma/seed.ts
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { UserType } from '../generated/prisma/enums';
import * as bcrypt from 'bcrypt';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is required for the seed script');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

async function main(): Promise<void> {
  const roleNames = ['USER', 'STAFF', 'ADMIN'];
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@gray-merchant.test';

  const adminHash = await bcrypt.hash(adminPassword, saltRounds);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminHash,
      type: UserType.ADMIN,
    },
  });

  await prisma.application.upsert({
    where: { clientId: 'gray-merchant-staff' },
    update: {},
    create: {
      name: 'Gray Merchant Staff App',
      clientId: 'gray-merchant-staff',
      redirectUri: 'http://localhost:3000/admin/callback',
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete:', {
    roles: roleNames,
    adminEmail,
    clientId: 'gray-merchant-staff',
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
