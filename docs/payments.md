# Payment Architecture

GUZO uses an abstraction layer for payment providers and maintains a provider-specific implementation for Chapa.

## Design

- PaymentService orchestrates payment flows
- PaymentProvider interface allows multiple providers
- Webhook verification is required before any state change
- Duplicate processing must be prevented with idempotency keys or transaction checks
- Financial split logic is server-side only
