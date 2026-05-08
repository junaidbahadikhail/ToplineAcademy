const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// ── Change these before running ──────────────────────────────────────────────
const ADMIN_NAME     = 'Super Admin';
const ADMIN_EMAIL    = 'admin@toplineacademy.com';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_PHONE    = '0300-0000000';
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN', isVerified: true, isActive: true },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Admin user ready:', user.email, '| role:', user.role);
}

main()
  .catch((err) => { console.error('❌ Error:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
