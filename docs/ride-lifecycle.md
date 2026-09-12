# Ride Lifecycle

The ride state machine follows the configured lifecycle for all rides.

REQUESTED -> SEARCHING -> DRIVER_ASSIGNED -> DRIVER_ACCEPTED -> DRIVER_ARRIVING -> DRIVER_AT_PICKUP -> TRIP_STARTED -> TRIP_COMPLETED -> PAYMENT_PENDING -> COMPLETED

Additional terminal states: CANCELLED and NO_DRIVER_FOUND.

Each status change must store who changed it, the previous status, new status, timestamp, and optional reason.
