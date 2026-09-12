# Commission System

Commission is calculated on the backend and tracked using ledger entries, not by trusting client apps.

## Rules

- Platform commission is configured in admin settings.
- Cash rides create a `CASH_COMMISSION_DUE` ledger record.
- Digital rides split between platform and driver automatically.
- Outstanding balances are auditable and immutable.
- Admin restrictions can be applied when thresholds are reached.
