import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding privacy-first database...');
  // Database ini hanya menyimpan akun pengguna.
  // Data keuangan disimpan 100% lokal di HP pengguna.
  console.log('Database ready for User accounts & optional Cloud Backups!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
