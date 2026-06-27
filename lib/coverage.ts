import {
  ROLES,
  ROLE_KEYS,
  MESES,
  MESES_ABREV,
  type RoleKey,
  type Mode,
} from "./constants";

export interface Collaborator {
  id: number;
  name: string;
  role: RoleKey;
  mode: Mode;
}

// Mapa de asignaciones con clave `${collaboratorId}|${isoDate}` -> turno.
export type AssignmentMap = Record<string, string>;

export interface SatInfo {
  iso: string;
  head: string;
  sub: string;
  date: number;
}

export interface CollaboratorRow extends Collaborator {
  libre: number;
  libreOk: boolean;
  cells: Array<{ key: string; iso: string; shift: string }>;
}

export interface CoverageRoleDot {
  key: RoleKey;
  abbr: string;
  color: string;
  ok: boolean;
}

export interface CoverageCell {
  iso: string;
  ok: boolean;
  roles: CoverageRoleDot[];
  physOk: boolean;
}

export interface CoverageRow {
  block: "AM" | "PM";
  label: string;
  sub: string;
  cells: CoverageCell[];
}

export interface AlertIssue {
  problem: string;
  suggestion: string;
}

export interface AlertGroup {
  title: string;
  time: string;
  count: string;
  issues: AlertIssue[];
}

export interface PlannerView {
  monthLabel: string;
  satData: SatInfo[];
  rows: CollaboratorRow[];
  coverageRows: CoverageRow[];
  alerts: AlertGroup[];
  alertCount: number;
  alertOk: boolean;
}

// Sábados (getDay()===6) del mes indicado (month es 0-based, como en JS Date).
export function saturdaysOfMonth(year: number, month: number): Date[] {
  const res: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === 6) res.push(new Date(d.getTime()));
    d.setDate(d.getDate() + 1);
  }
  return res;
}

export function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function shiftOf(assignments: AssignmentMap, cid: number, isoDate: string): string {
  return assignments[`${cid}|${isoDate}`] || "";
}

// ¿El turno cubre el bloque? AM se cubre con AM o Completo; PM con PM o Completo.
function covers(shift: string, block: "AM" | "PM"): boolean {
  return block === "AM" ? shift === "AM" || shift === "COMP" : shift === "PM" || shift === "COMP";
}

const BLOCK_META = {
  AM: { label: "Cobertura AM", time: "8am – 1pm" },
  PM: { label: "Cobertura PM", time: "1pm – 5pm" },
} as const;

// Construye toda la vista del planificador a partir del estado. Réplica fiel de
// la lógica original (renderVals) en forma de datos puros, sin estilos.
export function buildPlannerView(
  collaborators: Collaborator[],
  assignments: AssignmentMap,
  year: number,
  month: number,
  requirePhysical: boolean
): PlannerView {
  const sats = saturdaysOfMonth(year, month);
  const satData: SatInfo[] = sats.map((d) => ({
    iso: iso(d),
    head: `Sáb ${d.getDate()}`,
    sub: MESES_ABREV[d.getMonth()],
    date: d.getDate(),
  }));

  // Filas de colaboradores con su matriz de turnos y conteo de días libres.
  const rows: CollaboratorRow[] = collaborators.map((c) => {
    const cells = satData.map((s) => ({
      key: `${c.id}|${s.iso}`,
      iso: s.iso,
      shift: shiftOf(assignments, c.id, s.iso),
    }));
    const libre = satData.filter((s) => shiftOf(assignments, c.id, s.iso) === "LIBRE").length;
    return { ...c, cells, libre, libreOk: libre === 1 };
  });

  // Cobertura por bloque (AM/PM) y por sábado.
  let alertCount = 0;
  const blocks: Array<"AM" | "PM"> = ["AM", "PM"];
  const coverageRows: CoverageRow[] = blocks.map((block) => {
    const cells: CoverageCell[] = satData.map((s) => {
      const present = collaborators.filter((c) => covers(shiftOf(assignments, c.id, s.iso), block));
      const roles: CoverageRoleDot[] = ROLES.map((r) => ({
        key: r.key,
        abbr: r.abbr,
        color: r.color,
        ok: present.some((c) => c.role === r.key),
      }));
      const physOk = present.some((c) => c.mode === "fisico");
      const ok = roles.every((d) => d.ok) && (requirePhysical ? physOk : true) && present.length > 0;
      if (!ok) alertCount++;
      return { iso: s.iso, ok, roles, physOk };
    });
    return {
      block,
      label: BLOCK_META[block].label,
      sub: block === "AM" ? "8am – 1pm" : "1pm – 5pm",
      cells,
    };
  });

  // Detalle de alertas con explicación y sugerencia accionable.
  const alerts: AlertGroup[] = [];
  satData.forEach((s) => {
    blocks.forEach((block) => {
      const present = collaborators.filter((c) => covers(shiftOf(assignments, c.id, s.iso), block));
      const issues: AlertIssue[] = [];

      if (present.length === 0) {
        issues.push({
          problem: "No hay ningún colaborador asignado a este bloque.",
          suggestion:
            "Asigna colaboradores que cubran los 4 roles (Ventas, Administrativo, Contabilidad, Soporte) con al menos una persona física, usando turno " +
            block +
            " o Completo.",
        });
      } else {
        ROLES.filter((r) => !present.some((c) => c.role === r.key)).forEach((r) => {
          const cands = collaborators.filter((c) => c.role === r.key);
          const free = cands.filter((c) => {
            const sh = shiftOf(assignments, c.id, s.iso);
            return sh !== "AM" && sh !== "PM" && sh !== "COMP";
          });
          let suggestion: string;
          if (cands.length === 0) {
            suggestion =
              "No existe ningún colaborador con rol " +
              r.key +
              ". Créalo en la lista y asígnalo a este turno.";
          } else {
            const pool = free.length ? free : cands;
            suggestion =
              "Asigna a " +
              pool.map((c) => c.name).join(" o ") +
              " (rol " +
              r.key +
              ") en turno " +
              block +
              " o Completo el " +
              s.head +
              ".";
          }
          issues.push({
            problem: "Falta presencia del rol " + r.key + " en este bloque.",
            suggestion,
          });
        });

        if (requirePhysical && !present.some((c) => c.mode === "fisico")) {
          const physCands = collaborators.filter((c) => c.mode === "fisico");
          issues.push({
            problem: "Todos los colaboradores presentes son virtuales: nadie está físicamente.",
            suggestion:
              "Asigna al menos un colaborador físico" +
              (physCands.length ? " (" + physCands.map((c) => c.name).join(", ") + ")" : ", créalo primero") +
              " en turno " +
              block +
              " o Completo.",
          });
        }
      }

      if (issues.length) {
        alerts.push({
          title: s.head + " · " + BLOCK_META[block].label,
          time: BLOCK_META[block].time,
          count: issues.length + " problema" + (issues.length === 1 ? "" : "s"),
          issues,
        });
      }
    });
  });

  return {
    monthLabel: `${MESES[month]} ${year}`,
    satData,
    rows,
    coverageRows,
    alerts,
    alertCount,
    alertOk: alertCount === 0,
  };
}

export { ROLE_KEYS };
