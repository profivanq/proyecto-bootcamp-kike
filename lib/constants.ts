// Metadatos de dominio del Planificador de Sábados de iAcademy.
// Reflejan exactamente la lógica original de la demo.

export type RoleKey = "Ventas" | "Administrativo" | "Contabilidad" | "Soporte";
export type Mode = "fisico" | "virtual";
export type Shift = "AM" | "PM" | "COMP" | "LIBRE";

export interface RoleMeta {
  key: RoleKey;
  color: string;
  abbr: string;
  sortOrder: number;
}

export const ROLES: RoleMeta[] = [
  { key: "Ventas", color: "#0e9f6e", abbr: "Vt", sortOrder: 1 },
  { key: "Administrativo", color: "#2563eb", abbr: "Ad", sortOrder: 2 },
  { key: "Contabilidad", color: "#7c3aed", abbr: "Cb", sortOrder: 3 },
  { key: "Soporte", color: "#ea580c", abbr: "Sp", sortOrder: 4 },
];

export const ROLE_KEYS: RoleKey[] = ROLES.map((r) => r.key);

export function roleColor(role: string): string {
  return ROLES.find((r) => r.key === role)?.color ?? "#64748b";
}

export interface ShiftMeta {
  label: string;
  sub: string;
  bg: string;
  fg: string;
  border: string;
}

export function shiftMeta(sh: string): ShiftMeta {
  switch (sh) {
    case "AM":
      return { label: "AM", sub: "8–1", bg: "#fef3c7", fg: "#92400e", border: "#fcd34d" };
    case "PM":
      return { label: "PM", sub: "1–5", bg: "#dbeafe", fg: "#1e40af", border: "#93c5fd" };
    case "COMP":
      return { label: "Completo", sub: "8–5", bg: "#d1fae5", fg: "#065f46", border: "#6ee7b7" };
    case "LIBRE":
      return { label: "Libre", sub: "", bg: "#f1f5f9", fg: "#64748b", border: "#cbd5e1" };
    default:
      return { label: "—", sub: "", bg: "#ffffff", fg: "#cbd5e1", border: "#e2e8f0" };
  }
}

// Orden de rotación al hacer clic en una celda: vacío → AM → PM → Completo → Libre → vacío
export const SHIFT_CYCLE: string[] = ["", "AM", "PM", "COMP", "LIBRE"];

export function nextShift(current: string): string {
  const idx = SHIFT_CYCLE.indexOf(current);
  return SHIFT_CYCLE[(idx + 1) % SHIFT_CYCLE.length];
}

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const MESES_ABREV = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export const DEFAULT_ACCENT = "#0e7490";
