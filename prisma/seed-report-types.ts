import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding ReportTypes...');

  const reportTypes = [
    { name: 'document', shortName: 'เอกสาร' },
    { name: 'infographic', shortName: 'อินโฟกราฟิก' },
    { name: 'dashboard', shortName: 'แดชบอร์ด' },
  ];

  for (const type of reportTypes) {
    const existing = await prisma.reportType.findFirst({
      where: { name: type.name },
    });

    if (!existing) {
      await prisma.reportType.create({
        data: {
          name: type.name,
          shortName: type.shortName,
        },
      });
      console.log(`✓ Created ReportType: ${type.shortName} (${type.name})`);
    } else {
      console.log(`✓ ReportType already exists: ${type.shortName} (${type.name})`);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
