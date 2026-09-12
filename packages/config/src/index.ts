export const appConfig = {
  appName: 'GUZO',
  currency: 'ETB',
  timezone: 'Africa/Addis_Ababa',
  phoneCountryCode: '+251'
} as const;

export const rideStatuses = [
  'REQUESTED',
  'SEARCHING',
  'DRIVER_ASSIGNED',
  'DRIVER_ACCEPTED',
  'DRIVER_ARRIVING',
  'DRIVER_AT_PICKUP',
  'TRIP_STARTED',
  'TRIP_COMPLETED',
  'PAYMENT_PENDING',
  'COMPLETED',
  'CANCELLED',
  'NO_DRIVER_FOUND'
] as const;
