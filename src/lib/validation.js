export const TEXT_PATTERN = "[A-Za-z0-9 .,'()/#&+\\-]+";
export const DIGITS_PATTERN = "[0-9]+";
export const DECIMAL_PATTERN = "[0-9]+(\\.[0-9]{1,2})?";

const controlKeys = new Set(["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"]);

export function blockNumberInput(event, { decimal = false } = {}) {
  if (event.ctrlKey || event.metaKey || controlKeys.has(event.key)) return;
  if (/^[0-9]$/.test(event.key)) return;
  if (decimal && event.key === "." && !event.currentTarget.value.includes(".")) return;
  event.preventDefault();
}

export function isTextValue(value) {
  return new RegExp(`^${TEXT_PATTERN}$`).test(String(value || "").trim());
}

export function isDigits(value) {
  return new RegExp(`^${DIGITS_PATTERN}$`).test(String(value || "").trim());
}

export function isDecimal(value) {
  return new RegExp(`^${DECIMAL_PATTERN}$`).test(String(value || "").trim());
}
