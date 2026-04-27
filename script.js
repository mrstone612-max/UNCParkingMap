const lots = [
  { name: "Bell Tower Deck", rule: "paid", eventSensitive: true, notes: "Visitor pay parking; event controls may apply." },
  { name: "Boshamer Stadium Lot", rule: "permit", eventSensitive: true, notes: "Often event-controlled around athletics." },
  { name: "Bowles Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "Brauer Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "Business School Deck", rule: "paid", eventSensitive: true, notes: "Pay parking for many visitors." },
  { name: "Cobb Deck", rule: "paid", eventSensitive: true, notes: "Visitor pay option; event reservations possible." },
  { name: "Country Club Lot", rule: "permit", eventSensitive: true, notes: "Frequently impacted by game-day operations." },
  { name: "Craige Deck", rule: "permit", eventSensitive: false, notes: "Permit daytime, broader access evenings." },
  { name: "Dean Smith Center (Cardinal Lot)", rule: "paid", eventSensitive: true, notes: "Often sold/reserved for athletics." },
  { name: "Dogwood Deck", rule: "paid", eventSensitive: false, notes: "Typical visitor-pay deck." },
  { name: "Ehringhaus Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "Frank Porter Graham Deck", rule: "paid", eventSensitive: false, notes: "Visitor-pay friendly location." },
  { name: "Friday Center Park & Ride", rule: "permit", eventSensitive: false, notes: "Park-and-ride permit zone." },
  { name: "Hibbard Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "Jackson Deck", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "Kenan Football Center Lots", rule: "permit", eventSensitive: true, notes: "Event-sensitive near athletics." },
  { name: "Koury Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "Manning Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "McCauley Deck", rule: "permit", eventSensitive: false, notes: "Permit daytime, typically open later." },
  { name: "Morehead Planetarium Lot", rule: "paid", eventSensitive: true, notes: "Visitor pay and occasional reservations." },
  { name: "Morrison Residence Hall Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "Nash Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "Park & Ride RR Lot", rule: "permit", eventSensitive: false, notes: "Commuter-focused permit lot." },
  { name: "Rams Head Deck", rule: "paid", eventSensitive: true, notes: "Visitor pay, can be event-reserved." },
  { name: "Ridge Road Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "Skipper Bowles Drive Lot", rule: "permit", eventSensitive: true, notes: "May be controlled during major events." },
  { name: "South Road Deck", rule: "paid", eventSensitive: false, notes: "Pay parking for many visitors." },
  { name: "Stadium Drive Lot", rule: "permit", eventSensitive: true, notes: "Likely restricted during sports events." },
  { name: "Swain Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "Tarantino Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "University Baptist Lot", rule: "permit", eventSensitive: false, notes: "Permit daytime control." },
  { name: "Wilson Deck", rule: "paid", eventSensitive: true, notes: "Visitor pay; may be event-managed." },
];

const overrides = new Map();

const els = {
  dateInput: document.getElementById("dateInput"),
  timeInput: document.getElementById("timeInput"),
  userType: document.getElementById("userType"),
  permitStatus: document.getElementById("permitStatus"),
  eventMode: document.getElementById("eventMode"),
  lotsBody: document.getElementById("lotsBody"),
  summary: document.getElementById("summary"),
  recalcBtn: document.getElementById("recalcBtn"),
  overrideForm: document.getElementById("overrideForm"),
  overrideLot: document.getElementById("overrideLot"),
  overrideStatus: document.getElementById("overrideStatus"),
  overrideNote: document.getElementById("overrideNote"),
};

function isWeekday(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function isDayPermitWindow(timeValue) {
  return timeValue >= "07:30" && timeValue < "17:00";
}

function classifyLot(lot) {
  const override = overrides.get(lot.name.toLowerCase());
  if (override) return override;

  const date = els.dateInput.value;
  const time = els.timeInput.value;
  const weekday = isWeekday(date);
  const inDayWindow = isDayPermitWindow(time);
  const hasPermit = els.permitStatus.value === "has";
  const isVisitor = els.userType.value === "visitor";
  const specialEvent = els.eventMode.checked;

  if (specialEvent && lot.eventSensitive) {
    return { status: "reserved", reason: "Marked event-sensitive and event mode is enabled." };
  }

  if (lot.rule === "paid") {
    return {
      status: "open",
      reason: "Pay-to-park lot; generally available when spaces exist.",
    };
  }

  if (lot.rule === "permit") {
    if (weekday && inDayWindow && !hasPermit) {
      return {
        status: "reserved",
        reason: "Permit typically required weekdays 7:30am–5:00pm.",
      };
    }

    if (weekday && inDayWindow && hasPermit) {
      return {
        status: "open",
        reason: "Permit holder during daytime control window.",
      };
    }

    if (!weekday || !inDayWindow) {
      return {
        status: isVisitor ? "limited" : "open",
        reason: isVisitor
          ? "May open after 5pm/weekends, but signage or events can still restrict access."
          : "Often more open after 5pm/weekends unless specially reserved.",
      };
    }
  }

  return { status: "limited", reason: "Check posted signs." };
}

function render() {
  els.lotsBody.innerHTML = "";

  let openCount = 0;
  let reservedCount = 0;
  let limitedCount = 0;

  lots.forEach((lot) => {
    const classification = classifyLot(lot);
    if (classification.status === "open") openCount += 1;
    if (classification.status === "reserved") reservedCount += 1;
    if (classification.status === "limited") limitedCount += 1;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${lot.name}</td>
      <td>${lot.rule === "paid" ? "Paid Visitor" : "Permit Daytime"}${lot.eventSensitive ? " + Event Sensitive" : ""}</td>
      <td class="status-${classification.status}">${classification.status.toUpperCase()}</td>
      <td>${lot.notes} ${classification.reason}</td>
    `;
    els.lotsBody.appendChild(tr);
  });

  els.summary.textContent = `Open: ${openCount} | Reserved: ${reservedCount} | Limited: ${limitedCount}`;
}

function setDefaultDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  els.dateInput.value = `${yyyy}-${mm}-${dd}`;
}

els.recalcBtn.addEventListener("click", render);
[els.dateInput, els.timeInput, els.userType, els.permitStatus, els.eventMode].forEach((el) => {
  el.addEventListener("change", render);
});

els.overrideForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const lotKey = els.overrideLot.value.trim().toLowerCase();
  if (!lotKey) return;

  overrides.set(lotKey, {
    status: els.overrideStatus.value,
    reason: els.overrideNote.value.trim() || "User override.",
  });

  if (!lots.find((x) => x.name.toLowerCase() === lotKey)) {
    lots.push({
      name: els.overrideLot.value.trim(),
      rule: "permit",
      eventSensitive: false,
      notes: "User-added lot.",
    });
  }

  els.overrideForm.reset();
  render();
});

setDefaultDate();
render();
