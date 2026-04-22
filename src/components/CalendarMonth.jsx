function pad(value) {
  return String(value).padStart(2, "0");
}

function normalizeDateValue(value = "") {
  const raw = String(value).trim();
  const m = raw.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);

  if (!m) return "";

  const year = m[1];
  const month = String(m[2]).padStart(2, "0");
  const day = String(m[3]).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

function buildCalendarDays(monthValue) {
  if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) {
    return {
      monthLabel: "-",
      cells: [],
    };
  }

  const [year, month] = monthValue.split("-").map(Number);

  const firstDate = new Date(year, month - 1, 1);
  const startWeekday = firstDate.getDay();
  const mondayStart = startWeekday === 0 ? 6 : startWeekday - 1;
  const startDate = new Date(year, month - 1, 1 - mondayStart);

  const cells = [];

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);

    cells.push({
      date: current,
      dateKey: formatDateKey(current),
      isCurrentMonth: current.getMonth() === month - 1,
      isSunday: current.getDay() === 0,
      isSaturday: current.getDay() === 6,
    });
  }

  return {
    monthLabel: `${year}.${pad(month)}`,
    cells,
  };
}

function getStatusClass(status = "") {
  if (status === "확정") return "status-confirm";
  if (status === "조정요청") return "status-adjust";
  if (status === "반려") return "status-reject";
  if (status === "추가") return "status-added";
  return "status-review";
}

function getTimeText(value = "") {
  return String(value || "").trim();
}

function getOrgShortName(value = "") {
  const text = String(value || "").trim();
  if (!text) return "-";
  return text.length > 2 ? text.slice(0, 2) : text;
}

export default function CalendarMonth({ month, rows = [], onDateClick, onItemClick }) {
  const { monthLabel, cells } = buildCalendarDays(month);

  const rowsByDate = rows.reduce((acc, row) => {
    const key = normalizeDateValue(row.requestDate);
    if (!key) return acc;

    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <section className="calendar-wrap">
      <div className="calendar-top">
        <h2 className="calendar-title">{monthLabel}</h2>
      </div>

      <div className="calendar-weekdays">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`calendar-weekday ${index === 5 ? "is-sat" : ""} ${index === 6 ? "is-sun" : ""}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell) => {
          const items = rowsByDate[cell.dateKey] || [];

          return (
            <div
              key={cell.dateKey}
              className={`calendar-cell ${cell.isCurrentMonth ? "" : "is-outside"}`}
            >
              <button
                type="button"
                className={`calendar-date ${cell.isSunday ? "is-sun" : ""} ${cell.isSaturday ? "is-sat" : ""}`}
                onClick={() => onDateClick?.(cell.dateKey)}
              >
                {cell.date.getDate()}
              </button>

              <div className="calendar-items">
                {items.length === 0 ? (
                  <div className="calendar-empty">-</div>
                ) : (
                  items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`calendar-item ${getStatusClass(item.status)}`}
                      onClick={() => onItemClick?.(item)}
                      title={`${item.requestTimeBand || ""} | ${item.orgName || ""} | ${item.scheduleCodeName || ""}`}
                    >
                      <span className="calendar-item__badge">
                        {item.status || "검토"}
                      </span>

                      <span className="calendar-item__time">
                        {getTimeText(item.requestTimeBand)}
                      </span>

                      <span className="calendar-item__org">
                        [{getOrgShortName(item.orgName)}]
                      </span>

                      <span className="calendar-item__name">
                        {item.scheduleCodeName || "-"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}