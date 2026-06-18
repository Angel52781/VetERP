type DateOnlyParts = {
  year: number;
  month: number;
  day: number;
};

function parseDateOnlyParts(value: string | null | undefined): DateOnlyParts | null {
  if (!value) return null;

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const localDate = new Date(year, month - 1, day);
  if (
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function toDateOnlyInputValue(value: string | null | undefined): string {
  const parts = parseDateOnlyParts(value);
  if (!parts) return "";

  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

export function formatDateOnly(value: string | null | undefined): string {
  const parts = parseDateOnlyParts(value);
  if (!parts) return "—";

  const day = String(parts.day).padStart(2, "0");
  const month = String(parts.month).padStart(2, "0");
  return `${day}/${month}/${parts.year}`;
}

export function getAgeFromDateOnly(value: string | null | undefined, now = new Date()): number | null {
  const parts = parseDateOnlyParts(value);
  if (!parts) return null;

  let age = now.getFullYear() - parts.year;
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  if (currentMonth < parts.month || (currentMonth === parts.month && currentDay < parts.day)) {
    age -= 1;
  }

  return Math.max(0, age);
}