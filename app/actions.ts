"use server";

import { revalidatePath } from "next/cache";
import {
  cycleShiftDb,
  addCollaboratorDb,
  updateCollaboratorDb,
  deleteCollaboratorDb,
} from "@/lib/queries";
import { ROLE_KEYS } from "@/lib/coverage";
import type { RoleKey, Mode } from "@/lib/constants";

function parseRole(value: unknown): RoleKey | null {
  const v = String(value);
  return (ROLE_KEYS as string[]).includes(v) ? (v as RoleKey) : null;
}

function parseMode(value: unknown): Mode {
  return String(value) === "virtual" ? "virtual" : "fisico";
}

// Acepta solo una fecha calendárica válida que además sea sábado (invariante de
// dominio: solo se planifican sábados).
function isValidSaturday(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const back = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return back === iso && d.getDay() === 6;
}

export async function cycleShiftAction(collaboratorId: number, isoDate: string): Promise<void> {
  if (!Number.isInteger(collaboratorId) || collaboratorId <= 0) return;
  if (!isValidSaturday(isoDate)) return;
  await cycleShiftDb(collaboratorId, isoDate);
  revalidatePath("/");
}

export async function saveCollaboratorAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const role = parseRole(formData.get("role"));
  if (!role) return; // rol inválido: abortar en vez de degradar a un valor por defecto
  const mode = parseMode(formData.get("mode"));

  const rawId = formData.get("id");
  const id = rawId != null && rawId !== "" ? Number(rawId) : null;

  if (id != null && Number.isInteger(id) && id > 0) {
    await updateCollaboratorDb(id, name, role, mode);
  } else {
    await addCollaboratorDb(name, role, mode);
  }
  revalidatePath("/");
}

export async function deleteCollaboratorAction(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) return;
  await deleteCollaboratorDb(id);
  revalidatePath("/");
}
