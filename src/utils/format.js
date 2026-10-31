export const peso = (n) =>
  `₱${Number(n).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
  })}`;
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// Temporary payment reference; persistent record IDs are issued by the backend.
let referenceSequence = 0;
export function uniqueId(prefix) {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${(++referenceSequence).toString(36)}`;
  return `${prefix}-${id.toUpperCase()}`;
}
