// js/utils.js

export function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

export async function fetchJSON(path) {
  const resp = await fetch(path);
  if (!resp.ok) throw new Error(`Failed to load ${path}`);
  return resp.json();
}
