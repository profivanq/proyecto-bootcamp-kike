import { getSql, hasDatabase } from "./db";
import { ROLES } from "./constants";

// ── Datos de demo (idénticos a la versión original del planificador) ──────────
const DEMO_COLLABORATORS: Array<{
  id: number;
  name: string;
  role: string;
  mode: string;
}> = [
  { id: 1, name: "Nathaly", role: "Ventas", mode: "fisico" },
  { id: 2, name: "Manuela", role: "Ventas", mode: "virtual" },
  { id: 3, name: "Alexandra", role: "Ventas", mode: "virtual" },
  { id: 4, name: "Alejandra", role: "Administrativo", mode: "fisico" },
  { id: 5, name: "Yoselyn", role: "Contabilidad", mode: "fisico" },
  { id: 6, name: "Cesar", role: "Soporte", mode: "fisico" },
];

// Asignaciones de los sábados de junio 2026 (6, 13, 20, 27).
const DEMO_ASSIGNMENTS: Array<{ cid: number; date: string; shift: string }> = [
  { cid: 1, date: "2026-06-06", shift: "LIBRE" }, { cid: 2, date: "2026-06-06", shift: "COMP" }, { cid: 3, date: "2026-06-06", shift: "AM" }, { cid: 4, date: "2026-06-06", shift: "COMP" }, { cid: 5, date: "2026-06-06", shift: "LIBRE" }, { cid: 6, date: "2026-06-06", shift: "PM" },
  { cid: 1, date: "2026-06-13", shift: "COMP" }, { cid: 2, date: "2026-06-13", shift: "LIBRE" }, { cid: 3, date: "2026-06-13", shift: "PM" }, { cid: 4, date: "2026-06-13", shift: "AM" }, { cid: 5, date: "2026-06-13", shift: "COMP" }, { cid: 6, date: "2026-06-13", shift: "LIBRE" },
  { cid: 1, date: "2026-06-20", shift: "AM" }, { cid: 2, date: "2026-06-20", shift: "PM" }, { cid: 3, date: "2026-06-20", shift: "LIBRE" }, { cid: 4, date: "2026-06-20", shift: "COMP" }, { cid: 5, date: "2026-06-20", shift: "COMP" }, { cid: 6, date: "2026-06-20", shift: "COMP" },
  { cid: 1, date: "2026-06-27", shift: "PM" }, { cid: 2, date: "2026-06-27", shift: "AM" }, { cid: 3, date: "2026-06-27", shift: "COMP" }, { cid: 4, date: "2026-06-27", shift: "LIBRE" }, { cid: 5, date: "2026-06-27", shift: "AM" }, { cid: 6, date: "2026-06-27", shift: "PM" },
];

async function createSchema(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS roles (
      key        TEXT PRIMARY KEY,
      color      TEXT NOT NULL,
      abbr       TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS collaborators (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      role       TEXT NOT NULL REFERENCES roles(key),
      mode       TEXT NOT NULL DEFAULT 'fisico' CHECK (mode IN ('fisico','virtual')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shift_assignments (
      id              SERIAL PRIMARY KEY,
      collaborator_id INTEGER NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
      work_date       DATE NOT NULL,
      shift           TEXT NOT NULL CHECK (shift IN ('AM','PM','COMP','LIBRE')),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (collaborator_id, work_date)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_shift_assignments_date
    ON shift_assignments(work_date)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS planner_settings (
      id               INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      require_physical BOOLEAN NOT NULL DEFAULT true,
      accent           TEXT NOT NULL DEFAULT '#0e7490'
    )
  `;
}

async function seedReferenceData(): Promise<void> {
  const sql = getSql();
  for (const r of ROLES) {
    await sql`
      INSERT INTO roles (key, color, abbr, sort_order)
      VALUES (${r.key}, ${r.color}, ${r.abbr}, ${r.sortOrder})
      ON CONFLICT (key) DO NOTHING
    `;
  }
  await sql`
    INSERT INTO planner_settings (id, require_physical, accent)
    VALUES (1, true, '#0e7490')
    ON CONFLICT (id) DO NOTHING
  `;
}

async function seedDemoIfEmpty(): Promise<void> {
  const sql = getSql();
  const rows = (await sql`SELECT COUNT(*)::int AS count FROM collaborators`) as Array<{
    count: number;
  }>;
  if (rows[0]?.count > 0) return; // ya hay datos (demo o reales); no re-sembramos

  for (const c of DEMO_COLLABORATORS) {
    await sql`
      INSERT INTO collaborators (id, name, role, mode)
      VALUES (${c.id}, ${c.name}, ${c.role}, ${c.mode})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  // Alinear la secuencia del SERIAL tras insertar ids explícitos.
  await sql`
    SELECT setval(
      pg_get_serial_sequence('collaborators','id'),
      (SELECT COALESCE(MAX(id), 1) FROM collaborators)
    )
  `;
  for (const a of DEMO_ASSIGNMENTS) {
    await sql`
      INSERT INTO shift_assignments (collaborator_id, work_date, shift)
      VALUES (${a.cid}, ${a.date}, ${a.shift})
      ON CONFLICT (collaborator_id, work_date) DO NOTHING
    `;
  }
}

let initPromise: Promise<void> | null = null;

// Garantiza (una vez por proceso) que el esquema existe y que los datos de demo
// están sembrados. Idempotente y seguro ante ejecuciones concurrentes.
export function ensureDb(): Promise<void> {
  if (!hasDatabase) {
    return Promise.reject(
      new Error(
        "Base de datos no configurada: falta DATABASE_URL. Conecta Neon en Vercel (Storage)."
      )
    );
  }
  if (!initPromise) {
    initPromise = (async () => {
      await createSchema();
      await seedReferenceData();
      await seedDemoIfEmpty();
    })().catch((err) => {
      initPromise = null; // permite reintentar en la próxima petición
      throw err;
    });
  }
  return initPromise;
}
