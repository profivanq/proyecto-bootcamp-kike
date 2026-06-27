import { getSql } from "./db";
import { ensureDb } from "./init";
import { nextShift, type RoleKey, type Mode } from "./constants";
import type { Collaborator, AssignmentMap } from "./coverage";

export interface PlannerData {
  collaborators: Collaborator[];
  assignments: AssignmentMap;
  requirePhysical: boolean;
  accent: string;
}

export async function getPlannerData(): Promise<PlannerData> {
  await ensureDb();
  const sql = getSql();

  const collaborators = (await sql`
    SELECT id, name, role, mode
    FROM collaborators
    ORDER BY id ASC
  `) as Collaborator[];

  // Forzamos work_date a texto ISO para evitar desfases por zona horaria.
  const assignmentRows = (await sql`
    SELECT collaborator_id,
           to_char(work_date, 'YYYY-MM-DD') AS work_date,
           shift
    FROM shift_assignments
  `) as Array<{ collaborator_id: number; work_date: string; shift: string }>;

  const assignments: AssignmentMap = {};
  for (const a of assignmentRows) {
    assignments[`${a.collaborator_id}|${a.work_date}`] = a.shift;
  }

  const settings = (await sql`
    SELECT require_physical, accent FROM planner_settings WHERE id = 1
  `) as Array<{ require_physical: boolean; accent: string }>;

  return {
    collaborators,
    assignments,
    requirePhysical: settings[0]?.require_physical ?? true,
    accent: settings[0]?.accent ?? "#0e7490",
  };
}

// Rota el turno de una celda: '' → AM → PM → COMP → LIBRE → '' (borra la fila).
export async function cycleShiftDb(collaboratorId: number, isoDate: string): Promise<void> {
  await ensureDb();
  const sql = getSql();
  const rows = (await sql`
    SELECT shift FROM shift_assignments
    WHERE collaborator_id = ${collaboratorId}
      AND work_date = ${isoDate}
  `) as Array<{ shift: string }>;

  const current = rows[0]?.shift ?? "";
  const next = nextShift(current);

  if (next === "") {
    await sql`
      DELETE FROM shift_assignments
      WHERE collaborator_id = ${collaboratorId}
        AND work_date = ${isoDate}
    `;
    return;
  }

  await sql`
    INSERT INTO shift_assignments (collaborator_id, work_date, shift)
    VALUES (${collaboratorId}, ${isoDate}, ${next})
    ON CONFLICT (collaborator_id, work_date)
    DO UPDATE SET shift = EXCLUDED.shift, updated_at = now()
  `;
}

export async function addCollaboratorDb(name: string, role: RoleKey, mode: Mode): Promise<void> {
  await ensureDb();
  const sql = getSql();
  await sql`
    INSERT INTO collaborators (name, role, mode)
    VALUES (${name}, ${role}, ${mode})
  `;
}

export async function updateCollaboratorDb(
  id: number,
  name: string,
  role: RoleKey,
  mode: Mode
): Promise<void> {
  await ensureDb();
  const sql = getSql();
  await sql`
    UPDATE collaborators
    SET name = ${name}, role = ${role}, mode = ${mode}, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function deleteCollaboratorDb(id: number): Promise<void> {
  await ensureDb();
  const sql = getSql();
  // Las asignaciones se borran en cascada (ON DELETE CASCADE).
  await sql`DELETE FROM collaborators WHERE id = ${id}`;
}
