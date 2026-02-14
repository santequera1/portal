import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding sedes...');

  // Check if organizations exist
  const minerva = await prisma.organization.findUnique({ where: { code: 'MINERVA' } });
  const fundisalud = await prisma.organization.findUnique({ where: { code: 'FUNDISALUD' } });

  if (!minerva || !fundisalud) {
    console.error('❌ Organizations not found. Please create MINERVA and FUNDISALUD first.');
    return;
  }

  // Delete existing sedes to avoid duplicates
  await prisma.sede.deleteMany({});

  // INSAMIBG (Minerva) sedes
  const insamibgArjona = await prisma.sede.create({
    data: {
      name: 'INSAMIBG Arjona',
      address: 'Arjona, Bolívar',
      phone: null,
      organizationId: minerva.id,
    },
  });

  const insamibgCartagena = await prisma.sede.create({
    data: {
      name: 'INSAMIBG Cartagena - Sede Administrativa',
      address: 'Cartagena, Bolívar',
      phone: null,
      organizationId: minerva.id,
    },
  });

  // FUNDISALUD sedes
  const fundisaludArjona = await prisma.sede.create({
    data: {
      name: 'FUNDISALUD Sede Arjona',
      address: 'Arjona, Bolívar',
      phone: null,
      organizationId: fundisalud.id,
    },
  });

  const fundisaludCartagena = await prisma.sede.create({
    data: {
      name: 'FUNDISALUD Cartagena - Sede Administrativa',
      address: 'Cartagena, Bolívar',
      phone: null,
      organizationId: fundisalud.id,
    },
  });

  console.log('✅ Sedes created:');
  console.log(`  - ${insamibgArjona.name} (ID: ${insamibgArjona.id})`);
  console.log(`  - ${insamibgCartagena.name} (ID: ${insamibgCartagena.id})`);
  console.log(`  - ${fundisaludArjona.name} (ID: ${fundisaludArjona.id})`);
  console.log(`  - ${fundisaludCartagena.name} (ID: ${fundisaludCartagena.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
