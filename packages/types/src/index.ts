export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN' | 'SUPPORT';
export type RideStatus =
  | 'REQUESTED'
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ACCEPTED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_AT_PICKUP'
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED'
  | 'PAYMENT_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_DRIVER_FOUND';

export type DriverAccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
export type DriverAvailability = 'OFFLINE' | 'ONLINE' | 'BUSY' | 'SUSPENDED';
export type PaymentMethod = 'CASH' | 'TELEBIRR' | 'MOBILE_MONEY' | 'BANK' | 'CARD';
export type PaymentState = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface AppConfig {
  appName: 'GUZO';
  currency: 'ETB';
  timezone: 'Africa/Addis_Ababa';
  phoneCountryCode: '+251';
}

export interface User {
  id: string;
  email?: string | null;
  phone: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
