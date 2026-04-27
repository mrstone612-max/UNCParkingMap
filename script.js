const els = {
  form: document.getElementById("reservationForm"),
  lotName: document.getElementById("lotName"),
  reservedUntil: document.getElementById("reservedUntil"),
  reporter: document.getElementById("reporter"),
  note: document.getElementById("note"),
  formMessage: document.getElementById("formMessage"),
  reservedBody: document.getElementById("reservedBody"),
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toDisplayDate(isoDateTime) {
  if (!isoDateTime) return "—";
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  return date.toLocaleString();
}

async function loadReservedLots() {
  const res = await fetch("/api/reservations");
  const data = await res.json();

  els.reservedBody.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    els.reservedBody.innerHTML = '<tr><td colspan="5">No reserved lots reported yet.</td></tr>';
    return;
  }

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(item.lot_name)}</td>
      <td>${escapeHtml(toDisplayDate(item.reserved_until))}</td>
      <td>${escapeHtml(item.reporter || "—")}</td>
      <td>${escapeHtml(item.note || "—")}</td>
      <td><button data-id="${item.id}" class="clear-btn">Clear</button></td>
    `;
    els.reservedBody.appendChild(tr);
  });

  document.querySelectorAll(".clear-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await fetch(`/api/reservations/${btn.dataset.id}`, { method: "DELETE" });
      await loadReservedLots();
    });
  });
}

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    lot_name: els.lotName.value.trim(),
    reserved_until: els.reservedUntil.value ? new Date(els.reservedUntil.value).toISOString() : "",
    reporter: els.reporter.value.trim(),
    note: els.note.value.trim(),
  };

  if (!payload.lot_name) {
    els.formMessage.textContent = "Lot name is required.";
    return;
  }

  const res = await fetch("/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    els.formMessage.textContent = err.error || "Failed to save.";
    return;
  }

  els.form.reset();
  els.formMessage.textContent = "Reserved lot saved.";
  await loadReservedLots();
});

loadReservedLots();
