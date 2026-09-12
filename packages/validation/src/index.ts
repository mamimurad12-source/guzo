import { z } from 'zod';

export const phoneSchema = z.string().min(9).max(15).regex(/^\+?251\d+$/);
export const emailSchema = z.string().email().optional().or(z.literal(''));

export const registerUserSchema = z.object({
  phone: phoneSchema,
  email: emailSchema,
  password: z.string().min(8),
  name: z.string().min(2).max(80).optional()
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(8)
});

export const rideRequestSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  destinationLat: z.number(),
  destinationLng: z.number(),
  paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE_MONEY', 'BANK', 'TELEBIRR']).optional()
});
