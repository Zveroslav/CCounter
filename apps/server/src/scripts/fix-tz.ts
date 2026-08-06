import { prisma } from '../prisma';

async function fix() {
  await prisma.user.updateMany({ data: { timezone: 'Asia/Tbilisi' } });
  console.log('Fixed timezone');
}
fix().finally(() => prisma.$disconnect());
