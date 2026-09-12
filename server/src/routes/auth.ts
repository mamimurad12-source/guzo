import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';

import {
  comparePassword,
  hashPassword,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/auth';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { normalizePhoneNumber } from '../utils/phone';

const router = Router();

const registerSchema = z.object({
  email: z.string().email().optional().or(z.literal('')).transform((value) => (value ? value.trim().toLowerCase() : undefined)),
  phone: z.string().min(8, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PASSENGER', 'DRIVER']).default('PASSENGER'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const driverRegisterSchema = z.object({
  email: z.string().email().optional().or(z.literal('')).transform((value) => (value ? value.trim().toLowerCase() : undefined)),
  phone: z.string().min(8, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  vehicleType: z.string().optional(),
  plateNumber: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().optional(),
  color: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const driverOnboardingSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  vehicleType: z.string().min(1).optional(),
  plateNumber: z.string().min(1).optional(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.coerce.number().int().positive().optional(),
  color: z.string().min(1).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
}).refine((value) => value.email || value.phone, {
  message: 'Email or phone is required',
  path: ['email'],
});

const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8),
});

function isUserAccountAllowedForLogin(user: { isActive: boolean; status: string }) {
  if (!user.isActive) {
    return false;
  }

  return user.status !== 'INACTIVE' && user.status !== 'SUSPENDED';
}

async function issueTokens(user: { id: string; role: string; email: string | null; phone: string }, tokenFamily: string = crypto.randomUUID()) {
  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
  });

  const refreshToken = signRefreshToken({
    userId: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
  });

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      tokenFamily,
      expiresAt,
    },
  });

  return { accessToken, refreshToken, tokenFamily };
}

router.post('/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid registration payload' });
    return;
  }

  const { email, phone, password, role, firstName, lastName } = parsed.data;
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!normalizedPhone) {
    res.status(400).json({ message: 'Phone number is required' });
    return;
  }

  if (role === 'DRIVER') {
    res.status(400).json({ message: 'Use the driver registration endpoint for driver accounts' });
    return;
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedPhone },
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
    },
  });

  if (existingUser) {
    res.status(409).json({ message: 'A user with that phone or email already exists' });
    return;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: email ?? null,
      phone: normalizedPhone,
      passwordHash,
      role: 'PASSENGER',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  await prisma.passengerProfile.create({
    data: {
      userId: user.id,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
    },
  });

  const tokens = await issueTokens(user);

  res.status(201).json({
    message: 'Passenger registered successfully',
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
    ...tokens,
  });
});

router.post('/driver/register', async (req, res) => {
  const parsed = driverRegisterSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid driver registration payload' });
    return;
  }

  const { email, phone, password, firstName, lastName, vehicleType, plateNumber, make, model, year, color } = parsed.data;
  const normalizedPhone = normalizePhoneNumber(phone);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedPhone },
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
    },
  });

  if (existingUser) {
    res.status(409).json({ message: 'A driver with that phone or email already exists' });
    return;
  }

  const passwordHash = await hashPassword(password);

  const { user, driverProfile } = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: email ?? null,
        phone: normalizedPhone,
        passwordHash,
        role: 'DRIVER',
        status: 'PENDING_VERIFICATION',
        isActive: true,
      },
    });

    const createdProfile = await tx.driverProfile.create({
      data: {
        userId: createdUser.id,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        phone: normalizedPhone,
        verificationStatus: 'PENDING_VERIFICATION',
        driverStatus: 'OFFLINE',
      },
    });

    if (plateNumber) {
      await tx.vehicle.create({
        data: {
          plateNumber,
          make: make ?? null,
          model: model ?? null,
          year: year ?? null,
          color: color ?? null,
          vehicleType: vehicleType ?? null,
          driverProfileId: createdProfile.id,
        },
      });
    }

    return { user: createdUser, driverProfile: createdProfile };
  });

  const tokens = await issueTokens(user);

  res.status(201).json({
    message: 'Driver registered successfully',
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
    ...tokens,
  });
});

router.post('/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid login payload' });
    return;
  }

  const { email, phone, password } = parsed.data;

  const lookup = email ? { email: email.toLowerCase() } : phone ? { phone: normalizePhoneNumber(phone) } : null;

  if (!lookup) {
    res.status(400).json({ message: 'Email or phone is required' });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      ...lookup,
    },
  });

  if (!user) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  if (!isUserAccountAllowedForLogin(user)) {
    res.status(401).json({ message: 'Account is not active' });
    return;
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await issueTokens(user);

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
    ...tokens,
  });
});

router.post('/auth/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: 'Refresh token is required' });
    return;
  }

  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    const tokenHash = hashToken(parsed.data.refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      res.status(401).json({ message: 'Refresh token is invalid or expired' });
      return;
    }

    const user = storedToken.user;
    const family = storedToken.tokenFamily ?? crypto.randomUUID();

    await prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        tokenFamily: family,
        revoked: false,
        id: { not: storedToken.id },
      },
      data: { revoked: true },
    });

    const tokens = await issueTokens({
      id: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
    }, family);

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    res.json({
      message: 'Token refreshed successfully',
      ...tokens,
    });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.post('/auth/logout', async (req, res) => {
  const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : null;

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken) },
      data: { revoked: true },
    });
  }

  res.json({ message: 'Logged out successfully' });
});

router.post('/auth/forgot-password', async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid forgot-password payload' });
    return;
  }

  const { email, phone } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone: normalizePhoneNumber(phone) }] : []),
      ],
    },
  });

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'PasswordResetToken',
        entityId: user.id,
        metadata: { purpose: 'password-reset' },
      },
    });
  }

  res.json({
    message: 'If an account exists, a password reset link has been sent.',
  });
});

router.post('/auth/reset-password', async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid reset-password payload' });
    return;
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      revoked: false,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!resetRecord) {
    res.status(400).json({ message: 'Password reset link is invalid or expired' });
    return;
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: resetRecord.userId },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.update({
    where: { id: resetRecord.id },
    data: { usedAt: new Date(), revoked: true },
  });

  await prisma.refreshToken.updateMany({
    where: { userId: resetRecord.userId },
    data: { revoked: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: resetRecord.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entity: 'User',
      entityId: resetRecord.userId,
      metadata: { resetTokenUsed: true },
    },
  });

  res.json({ message: 'Password reset successful' });
});

router.get('/admin/me', authenticate, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, email: true, phone: true, role: true, status: true },
  });

  res.json({
    user,
    permissions: ['ADMIN'],
  });
});

router.get('/passenger/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: {
      passengerProfile: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (user.role !== 'PASSENGER') {
    res.status(403).json({ message: 'Passenger profile is not available for this role' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profile: user.passengerProfile ?? null,
    },
  });
});

router.get('/users/me', authenticate, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: {
      passengerProfile: true,
      driverProfile: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profile: user.passengerProfile ?? user.driverProfile ?? null,
    },
  });
});

router.get('/driver/profile', authenticate, requireRole('DRIVER'), async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: {
      driverProfile: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profile: user.driverProfile ?? null,
    },
  });
});

router.post('/driver/onboarding', authenticate, requireRole('DRIVER'), async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const parsed = driverOnboardingSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid onboarding payload' });
    return;
  }

  const { vehicleType, plateNumber, make, model, year, color, firstName, lastName } = parsed.data;

  const driverProfile = await prisma.driverProfile.upsert({
    where: { userId: req.user.userId },
    update: {
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      verificationStatus: 'PENDING_VERIFICATION',
    },
    create: {
      userId: req.user.userId,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      phone: req.user.phone ?? '',
      verificationStatus: 'PENDING_VERIFICATION',
    },
  });

  if (plateNumber) {
    await prisma.vehicle.upsert({
      where: { plateNumber },
      update: {
        make: make ?? undefined,
        model: model ?? undefined,
        year: year ? Number(year) : undefined,
        color: color ?? undefined,
        vehicleType: vehicleType ?? undefined,
        driverProfileId: driverProfile.id,
      },
      create: {
        plateNumber,
        make: make ?? null,
        model: model ?? null,
        year: year ? Number(year) : null,
        color: color ?? null,
        vehicleType: vehicleType ?? null,
        driverProfileId: driverProfile.id,
      },
    });
  }

  res.status(202).json({
    message: 'Driver onboarding started',
    driverProfile,
  });
});

export default router;
