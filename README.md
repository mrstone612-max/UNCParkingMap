# UNC Parking Map (Student Availability Helper)

Simple static website that estimates whether UNC-Chapel Hill parking lots are **open, reserved, or limited** based on:

- General parking patterns from `move.unc.edu` (visitor-paid vs permit daytime windows).
- User inputs (date, time, student/visitor, permit ownership, and event mode).
- User overrides for temporary closures/reservations.

## Run locally

Because this is a static site, you can just open `index.html` directly, or use a local web server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Notes

- This tool is for planning and does **not** replace posted lot signage.
- Event days can change access quickly; use the **special event toggle** and per-lot overrides.
- Keep lot statuses updated with official announcements from move.unc.edu.
