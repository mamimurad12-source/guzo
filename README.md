# GUZO

GUZO is a modern mobility platform for Ethiopia, built as a modular monorepo for passengers, drivers, admins, and backend services.

This repository is the Phase 1 foundation for the platform and is intentionally structured to support the full eventual product roadmap described in the project brief.

## What is included in Phase 1

- Monorepo workspace structure
- Passenger Expo app foundation
- Driver Expo app foundation
- Admin web app foundation
- Shared packages for types, config, validation, utilities, UI, and API client
- Express API server foundation
- Prisma schema foundation with core entities
- Environment configuration
- Documentation scaffold

## Architecture overview

- Passenger app: React Native + Expo
- Driver app: React Native + Expo
- Admin app: React + Vite
- Backend: Node.js + TypeScript + Express + Socket.IO
- Database: PostgreSQL + Prisma

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 15+
- Expo CLI

## Installation

```bash
npm install
```

## Environment setup

Copy the sample environment file and update values as needed:

```bash
cp .env.example .env
```

## Database setup

```bash
npm run db:generate
npm run db:push
```

## Running locally

```bash
npm run dev:server
npm run dev:passenger
npm run dev:driver
npm run dev:admin
```

## Project structure

```text
guzo/
  apps/
    passenger/
    driver/
    admin/
  packages/
    api-client/
    types/
    validation/
    config/
    utils/
    ui/
  server/
  docs/
  .env.example
  README.md
```

## Current status

Phase 1 is the foundation stage. The repository is set up to support a real production architecture, but full ride-flow implementation is intentionally deferred until the foundation is stable.

## Next steps

- Validate the environment and dependencies
- Create the database schema and migrations
- Build auth and RBAC
- Implement ride lifecycle and matching
- Extend admin, payments, and notifications
