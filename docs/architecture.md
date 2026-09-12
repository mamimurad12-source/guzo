# GUZO Architecture

This repository provides the Phase 1 foundation for a real-world mobility platform. The architecture is intentionally separated into mobile apps, admin web, backend services, and shared packages.

## Domain boundaries

- Passenger app: pickup, ride request, trip tracking, payments
- Driver app: onboarding, online/offline state, acceptance, trip completion, earnings
- Admin app: operations, finance, driver management, pricing
- Backend: auth, pricing, trip lifecycle, payment verification, notifications, Socket.IO

## Principles

- Shared types and validation stay outside UI code
- Provider abstractions are used for maps, payments, and notifications
- Business logic stays on the backend
- Database writes go through Prisma
- Financial records are immutable and auditable
