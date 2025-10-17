export function Clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function Round(value: number, precision = 2) {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}