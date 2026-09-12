import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { prisma } from './lib/prisma';
import authRoutes from './routes/auth';

const app = express();
const port = Number(process.env.PORT ?? 4000);

async function ensureSeedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@guzo.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await import('bcryptjs').then(({ default: bcrypt }) => bcrypt.hash(adminPassword, 12));

    await prisma.user.create({
      data: {
        email: adminEmail,
        phone: '+251900000000',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        isActive: true,
      },
    });
  }
}

app.use(helmet());
app.use(cors());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'guzo-server' });
});

app.get('/api/v1', (_req, res) => {
  res.json({ name: 'GUZO API', version: 'v1' });
});

app.use('/api/v1', authRoutes);

app.listen(port, async () => {
  await ensureSeedAdmin();
  console.log(`GUZO server running on http://localhost:${port}`);
});
