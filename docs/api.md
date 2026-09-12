# API Overview

The backend exposes versioned endpoints under `/api/v1`.

## Authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

## Passenger

- `GET /api/v1/passenger/profile`
- `POST /api/v1/rides`
- `GET /api/v1/rides`
- `GET /api/v1/rides/:id`
- `POST /api/v1/rides/:id/cancel`

## Driver

- `POST /api/v1/driver/go-online`
- `POST /api/v1/driver/go-offline`
- `GET /api/v1/driver/rides`
- `POST /api/v1/driver/rides/:id/accept`

## Payments

- `POST /api/v1/payments/initialize`
- `GET /api/v1/payments/:id`
- `POST /api/v1/payments/webhook`

## Admin

- Protected with ADMIN or SUPPORT enforcement on the server side.
