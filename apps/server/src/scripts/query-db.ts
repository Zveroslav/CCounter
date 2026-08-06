import { prisma } from '../prisma';
async function run() {
  console.log('Weekly Summaries:');
  const w = await prisma.weeklySummary.findMany();
  console.log(w);
  console.log('Monthly Summaries:');
  const m = await prisma.monthlySummary.findMany();
  console.log(m);
}
run().finally(() => prisma.$disconnect());
