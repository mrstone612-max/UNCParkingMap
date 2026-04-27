#!/usr/bin/env python3
import json
import sqlite3
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "parking.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lot_name TEXT NOT NULL,
                note TEXT,
                reporter TEXT,
                reserved_until TEXT,
                created_at TEXT NOT NULL
            )
            """
        )


class ParkingHandler(SimpleHTTPRequestHandler):
    def _send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/reservations":
            with get_conn() as conn:
                rows = conn.execute(
                    "SELECT id, lot_name, note, reporter, reserved_until, created_at FROM reservations ORDER BY created_at DESC"
                ).fetchall()
            self._send_json([dict(row) for row in rows])
            return

        if parsed.path == "/" or parsed.path == "":
            self.path = "/index.html"

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/reservations":
            self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)
            return

        try:
            payload = self._read_json_body()
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON body"}, status=HTTPStatus.BAD_REQUEST)
            return

        lot_name = (payload.get("lot_name") or "").strip()
        note = (payload.get("note") or "").strip()
        reporter = (payload.get("reporter") or "").strip()
        reserved_until = (payload.get("reserved_until") or "").strip()

        if not lot_name:
            self._send_json({"error": "lot_name is required"}, status=HTTPStatus.BAD_REQUEST)
            return

        created_at = datetime.now(timezone.utc).isoformat()

        with get_conn() as conn:
            cur = conn.execute(
                """
                INSERT INTO reservations (lot_name, note, reporter, reserved_until, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (lot_name, note, reporter, reserved_until, created_at),
            )
            reservation_id = cur.lastrowid

        self._send_json(
            {
                "id": reservation_id,
                "lot_name": lot_name,
                "note": note,
                "reporter": reporter,
                "reserved_until": reserved_until,
                "created_at": created_at,
            },
            status=HTTPStatus.CREATED,
        )

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/api/reservations/"):
            self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)
            return

        reservation_id = parsed.path.rsplit("/", 1)[-1]
        if not reservation_id.isdigit():
            self._send_json({"error": "Invalid reservation id"}, status=HTTPStatus.BAD_REQUEST)
            return

        with get_conn() as conn:
            cur = conn.execute("DELETE FROM reservations WHERE id = ?", (int(reservation_id),))

        if cur.rowcount == 0:
            self._send_json({"error": "Reservation not found"}, status=HTTPStatus.NOT_FOUND)
            return

        self._send_json({"ok": True})


def run():
    init_db()
    server = ThreadingHTTPServer(("0.0.0.0", 8000), ParkingHandler)
    print("Serving on http://localhost:8000")
    server.serve_forever()


if __name__ == "__main__":
    run()
