# UNC Reserved Parking Tracker

This app now shows **only lots that users mark as reserved**.

## What changed

- Removed the pre-seeded/all-lot listing.
- Added a SQLite database to persist user-reported reserved lots.
- Added APIs to create/list/clear reserved-lot reports.

## Run locally

```bash
python3 server.py
```

Then open `http://localhost:8000`.

## Data model

Database file: `parking.db`

Table: `reservations`
- `id`
- `lot_name`
- `note`
- `reporter`
- `reserved_until`
- `created_at`
