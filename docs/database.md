# Database Design

The database schema is intentionally designed for Ethiopian expansion and multi-city operations.

## Core entities

- User
- PassengerProfile
- DriverProfile
- DriverDocument
- Vehicle
- Ride
- RideStatusHistory
- Fare
- Payment
- PaymentTransaction
- DriverLedger
- Commission
- Rating
- Notification
- SupportTicket
- AdminSetting
- City
- ServiceArea
- AuditLog

## Design goals

- UUID primary keys
- Decimal money fields
- Typed enums for roles and ride states
- Soft deletion is handled at the application layer where appropriate
- Service areas and city configuration are decoupled from hardcoded values
