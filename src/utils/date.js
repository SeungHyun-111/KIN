// src/utils/date.js

export function normalizeDateValue(value = "") {
  const raw = String(value).trim();
  const m = raw.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);

  if (!m) return "";

  const year = m[1];
  const month = String(m[2]).padStart(2, "0");
  const day = String(m[3]).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function normalizeMonthValue(value = "") {
  const date = normalizeDateValue(value);
  return date ? date.slice(0, 7) : "";
}

export function formatDateKey(date) {
  if (!(date instanceof Date)) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function normalizeTimeValue(value = "") {
  const raw = String(value).trim();

  let m = raw.match(/^(\d{1,2})\s*시$/);
  if (m) return `${String(m[1]).padStart(2, "0")}시`;

  m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return `${String(m[1]).padStart(2, "0")}시`;

  m = raw.match(/^(\d{1,2})$/);
  if (m) return `${String(m[1]).padStart(2, "0")}시`;

  return raw;
}

export function getWeekdayKor(dateStr = "") {
  const d = new Date(normalizeDateValue(dateStr));
  if (isNaN(d)) return "";
  const arr = ["일", "월", "화", "수", "목", "금", "토"];
  return arr[d.getDay()];
}