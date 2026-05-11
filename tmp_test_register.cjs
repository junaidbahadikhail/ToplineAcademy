const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const p = new PrismaClient();

async function test() {
  try {
    // Test 1: Can we read from users?
    const count = await p.user.count();
    console.log('User count:', count);

    // Test 2: Can we create a user?
    const hash = await bcrypt.hash('testpass123', 10);
    const user = await p.user.create({
      data: {
        name: 'Test User',
        email: 'test_' + Date.now() + '@example.com',
        phone: '03001234567',
        city: 'Karachi',
        passwordHash: hash,
        role: 'STUDENT',
        isVerified: true,
      },
    });
    console.log('Created user:', user.id, user.email);

    // Clean up
    await p.user.delete({ where: { id: user.id } });
    console.log('Cleaned up. All OK!');
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('Code:', e.code);
  } finally {
    await p.$disconnect();
  }
}

test();
