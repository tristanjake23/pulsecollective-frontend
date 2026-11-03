import { today } from "./format.js";

export function minimumBirthDate() {
  const now = new Date();
  return `${now.getFullYear() - 130}-01-01`;
}

export function birthDateError(value, required = false) {
  if (!value) return required ? "Enter your date of birth." : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Enter a valid date of birth.";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime()) ||
      date.getFullYear() !== Number(value.slice(0, 4)) ||
      date.getMonth() + 1 !== Number(value.slice(5, 7)) ||
      date.getDate() !== Number(value.slice(8, 10))) return "Enter a valid date of birth.";
  if (value > today()) return "Date of birth cannot be in the future.";
  if (value < minimumBirthDate()) return "Check the year in your date of birth.";
  return "";
}

export function phoneError(value, required = false) {
  if (!value?.trim()) return required ? "Enter your phone number." : "";
  const phone = value.trim();
  const digits = phone.replace(/\D/g, "");
  return /^\+?[\d\s().-]+$/.test(phone) && digits.length >= 7 && digits.length <= 15
    ? "" : "Enter a valid phone number, such as 09123456789 or +639123456789.";
}

export function patientServiceError(error) {
  return error.status >= 500 || /DATABASE_URL|pooler|database connection|not configured/i.test(error.message || "")
    ? "The clinic service is temporarily unavailable. Please try again shortly."
    : error.message || "Unable to complete your request. Please try again.";
}
