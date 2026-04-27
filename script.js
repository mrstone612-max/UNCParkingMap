const STORAGE_KEY = "unc_reserved_reports_v1";

const els = {
  form: document.getElementById("reservationForm"),
  lotName: document.getElementById("lotName"),
  reservedUntil: document.getElementById("reservedUntil"),
  reporter: document.getElementById("reporter"),
  note: document.getElementById("note"),
  formMessage: document.getElementById("formMessage"),
  reservedBody: document.getElementById("reservedBody"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  clearAllBtn: document.getElementById("clearAllBtn"),
};

function readReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function escapeHtml(value) {
  return String(value)
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

function renderReports() {
  const reports = readReports();
  els.reservedBody.innerHTML = "";

  if (reports.length === 0) {
    els.reservedBody.innerHTML = '<tr><td colspan="6">No reserved lot reports yet.</td></tr>';
    return;
  }

  reports
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .forEach((report) => {
      const tr = document.createElement("tr");
      const accurate = report.reviews?.accurate ?? 0;
      const inaccurate = report.reviews?.inaccurate ?? 0;
      const score = accurate - inaccurate;

      tr.innerHTML = `
        <td>${escapeHtml(report.lot_name)}</td>
        <td>${escapeHtml(toDisplayDate(report.reserved_until))}</td>
        <td>${escapeHtml(report.reporter || "—")}</td>
        <td>${escapeHtml(report.note || "—")}</td>
        <td>
          <div class="review-box">
            <span class="score">Score: ${score}</span>
            <button class="vote-btn" data-id="${report.id}" data-vote="accurate">✅ Accurate (${accurate})</button>
            <button class="vote-btn" data-id="${report.id}" data-vote="inaccurate">❌ Inaccurate (${inaccurate})</button>
          </div>
        </td>
        <td><button class="remove-btn danger" data-id="${report.id}">Remove</button></td>
      `;
      els.reservedBody.appendChild(tr);
    });

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const reports = readReports().filter((x) => x.id !== btn.dataset.id);
      saveReports(reports);
      renderReports();
    });
  });

  document.querySelectorAll(".vote-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const reports = readReports();
      const found = reports.find((x) => x.id === btn.dataset.id);
      if (!found) return;

      found.reviews = found.reviews || { accurate: 0, inaccurate: 0 };
      if (btn.dataset.vote === "accurate") found.reviews.accurate += 1;
      if (btn.dataset.vote === "inaccurate") found.reviews.inaccurate += 1;

      saveReports(reports);
      renderReports();
    });
  });
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const lotName = els.lotName.value.trim();
  if (!lotName) {
    els.formMessage.textContent = "Lot name is required.";
    return;
  }

  const report = {
    id: crypto.randomUUID(),
    lot_name: lotName,
    reserved_until: els.reservedUntil.value ? new Date(els.reservedUntil.value).toISOString() : "",
    reporter: els.reporter.value.trim(),
    note: els.note.value.trim(),
    created_at: new Date().toISOString(),
    reviews: { accurate: 0, inaccurate: 0 },
  };

  const reports = readReports();
  reports.push(report);
  saveReports(reports);

  els.form.reset();
  els.formMessage.textContent = "Report added.";
  renderReports();
});

els.exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(readReports(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "unc-reserved-lot-reports.json";
  a.click();
  URL.revokeObjectURL(url);
});

els.importInput.addEventListener("change", async () => {
  const file = els.importInput.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("Invalid format");
    saveReports(parsed);
    els.formMessage.textContent = "Imported reports.";
    renderReports();
  } catch {
    els.formMessage.textContent = "Could not import JSON.";
  }

  els.importInput.value = "";
});

els.clearAllBtn.addEventListener("click", () => {
  saveReports([]);
  renderReports();
});

renderReports();
