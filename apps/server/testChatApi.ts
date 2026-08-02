import { prisma } from './src/prisma';
import jwt from 'jsonwebtoken';

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'test_chat_api@example.com',
      timezone: 'UTC',
    },
  });

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'test-secret');

  await prisma.meal.create({
    data: {
      userId: user.id,
      calories: 1200,
      protein: 100,
      carbs: 100,
      fat: 40,
      loggedAt: new Date(),
    }
  });

  console.log('Sending chat request...');
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: 'Am I eating enough protein?',
      period: 'Day'
    })
  });

  const text = await res.text();
  console.log('Response:', text);
}

main().catch(console.error).finally(() => prisma.$disconnect());
