"use client";

import { useMemo, useRef, useState, useTransition, type CSSProperties } from "react";
import { ROLES, shiftMeta, roleColor, type RoleKey, type Mode } from "@/lib/constants";
import { buildPlannerView, type Collaborator, type AssignmentMap } from "@/lib/coverage";
import {
  cycleShiftAction,
  saveCollaboratorAction,
  deleteCollaboratorAction,
} from "@/app/actions";

interface PlannerProps {
  collaborators: Collaborator[];
  assignments: AssignmentMap;
  requirePhysical: boolean;
  accent: string;
  initialYear: number;
  initialMonth: number;
}

interface Editing {
  id: number | null;
  name: string;
  role: RoleKey;
  mode: Mode;
}

export default function Planner({
  collaborators,
  assignments,
  requirePhysical,
  accent,
  initialYear,
  initialMonth,
}: PlannerProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [isPending, startTransition] = useTransition();
  const exportRef = useRef<HTMLDivElement>(null);

  const view = useMemo(
    () => buildPlannerView(collaborators, assignments, year, month, requirePhysical),
    [collaborators, assignments, year, month, requirePhysical]
  );

  function prevMonth() {
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    setMonth(m);
    setYear(y);
  }
  function nextMonth() {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    setMonth(m);
    setYear(y);
  }

  function rotate(cid: number, iso: string) {
    startTransition(async () => {
      try {
        await cycleShiftAction(cid, iso);
      } catch {
        alert("No se pudo guardar el cambio de turno. Intenta de nuevo.");
      }
    });
  }

  function onDelete(c: Collaborator) {
    if (!confirm(`¿Eliminar a ${c.name}? Se borrarán también sus turnos asignados.`)) return;
    startTransition(async () => {
      try {
        await deleteCollaboratorAction(c.id);
      } catch {
        alert("No se pudo eliminar al colaborador. Intenta de nuevo.");
      }
    });
  }

  async function exportJpg() {
    const node = exportRef.current;
    if (!node) return;
    const hidden = Array.from(node.querySelectorAll<HTMLElement>("[data-noexport]"));
    hidden.forEach((el) => (el.style.visibility = "hidden"));
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/jpeg", 0.95);
      const mes = view.monthLabel.split(" ")[0].toLowerCase();
      a.download = `programacion-iacademy-${mes}-${year}.jpg`;
      a.click();
    } catch {
      alert("No se pudo exportar la imagen. Intenta de nuevo.");
    } finally {
      hidden.forEach((el) => (el.style.visibility = ""));
    }
  }

  // ── estilos (portados del diseño original) ──────────────────────────────────
  const headerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "16px 24px",
    background: accent,
    color: "#fff",
    flexWrap: "wrap",
  };
  const navBtn: CSSProperties = {
    background: "rgba(255,255,255,.15)",
    color: "#fff",
    border: "none",
    width: 34,
    height: 34,
    borderRadius: 9,
    fontSize: 18,
    cursor: "pointer",
    fontWeight: 700,
    lineHeight: 1,
  };
  const alertPill: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    padding: "7px 14px",
    borderRadius: 20,
    cursor: "pointer",
    background: view.alertOk ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.22)",
    color: view.alertOk ? "#bbf7d0" : "#fecaca",
    border: "1px solid " + (view.alertOk ? "rgba(34,197,94,.45)" : "rgba(239,68,68,.5)"),
  };
  const exportBtn: CSSProperties = {
    background: "rgba(255,255,255,.15)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,.25)",
    padding: "7px 13px",
    borderRadius: 9,
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
  const addBtn: CSSProperties = {
    background: accent,
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 9,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  };
  const editBtn: CSSProperties = {
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    padding: "4px 9px",
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 11,
    cursor: "pointer",
  };
  const delBtn: CSSProperties = {
    background: "#fff",
    color: "#dc2626",
    border: "1px solid #fecaca",
    padding: "4px 9px",
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 11,
    cursor: "pointer",
  };
  const card: CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(2,6,23,.08)",
  };
  const cellBase: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    height: 52,
    borderRadius: 9,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    userSelect: "none",
    flex: 1,
    minWidth: 104,
  };
  const infoCol: CSSProperties = { width: 220, flex: "0 0 220px" };

  const legendShifts = ["AM", "PM", "COMP", "LIBRE"];

  return (
    <div className="shell">
      <div ref={exportRef} id="plan-export">
        {/* ── Header ── */}
        <div style={headerStyle}>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.2px" }}>
              Planificador de Sábados
            </span>
            <span
              style={{
                fontSize: 12,
                opacity: 0.7,
                fontWeight: 600,
                letterSpacing: ".5px",
                textTransform: "uppercase",
              }}
            >
              iAcademy · Turnos del mes
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button style={navBtn} onClick={prevMonth} data-noexport aria-label="Mes anterior">
              ‹
            </button>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                minWidth: 150,
                textAlign: "center",
                textTransform: "capitalize",
              }}
            >
              {view.monthLabel}
            </span>
            <button style={navBtn} onClick={nextMonth} data-noexport aria-label="Mes siguiente">
              ›
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={alertPill} onClick={() => setAlertsOpen(true)}>
              {view.alertOk
                ? "✓ Todos los bloques cubiertos"
                : `⚠ ${view.alertCount} bloque${view.alertCount === 1 ? "" : "s"} sin cubrir`}
              {"  ›"}
            </span>
            <button style={exportBtn} onClick={exportJpg} data-noexport>
              ⬇ Exportar JPG
            </button>
          </div>
        </div>

        {/* ── Cuerpo: 2 columnas ── */}
        <div
          style={{
            display: "flex",
            gap: 20,
            padding: 20,
            alignItems: "flex-start",
            background: "#eef2f6",
            flexWrap: "wrap",
          }}
        >
          {/* Barra lateral: Colaboradores */}
          <aside style={{ ...card, width: 330, flex: "1 1 300px", maxWidth: 360 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: "1px solid #eef2f6",
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 15 }}>Colaboradores</span>
              <button
                style={addBtn}
                data-noexport
                onClick={() => setEditing({ id: null, name: "", role: "Ventas", mode: "fisico" })}
              >
                + Agregar
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 14,
                maxHeight: 640,
                overflowY: "auto",
              }}
            >
              {view.rows.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 11,
                    padding: "11px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                  }}
                >
                  <span
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 4,
                      background: roleColor(r.role),
                      flex: "0 0 auto",
                      marginTop: 2,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{r.role}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 9px",
                          borderRadius: 20,
                          background: r.mode === "virtual" ? "#ede9fe" : "#e0f2fe",
                          color: r.mode === "virtual" ? "#6d28d9" : "#0369a1",
                        }}
                      >
                        {r.mode === "virtual" ? "Virtual" : "Físico"}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 9px",
                          borderRadius: 20,
                          background: r.libreOk ? "#dcfce7" : "#fef3c7",
                          color: r.libreOk ? "#166534" : "#92400e",
                        }}
                      >
                        {r.libre} libre{r.libre === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }} data-noexport>
                    <button
                      style={editBtn}
                      onClick={() =>
                        setEditing({ id: r.id, name: r.name, role: r.role, mode: r.mode })
                      }
                    >
                      Editar
                    </button>
                    <button style={delBtn} onClick={() => onDelete(r)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Panel principal: Asignación de turnos */}
          <section style={{ ...card, flex: "999 1 560px", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 18px",
                borderBottom: "1px solid #eef2f6",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>
                  Asignación de turnos ·{" "}
                  <span style={{ textTransform: "capitalize" }}>{view.monthLabel}</span>
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Haz clic en una celda para rotar: AM → PM → Completo → Libre
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                {legendShifts.map((sh) => {
                  const m = shiftMeta(sh);
                  return (
                    <span
                      key={sh}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 9px",
                        borderRadius: 7,
                        background: m.bg,
                        color: m.fg,
                        border: "1px solid " + m.border,
                      }}
                    >
                      {m.label}
                      {m.sub ? ` · ${m.sub}` : ""}
                    </span>
                  );
                })}
              </div>
            </div>

            <div style={{ overflowX: "auto", padding: "14px 18px 20px" }}>
              <div style={{ minWidth: 640, display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Encabezado de columnas */}
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <div
                    style={{
                      ...infoCol,
                      display: "flex",
                      alignItems: "center",
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#94a3b8",
                    }}
                  >
                    Colaborador
                  </div>
                  <div style={{ display: "flex", flex: 1, gap: 8 }}>
                    {view.satData.map((s) => (
                      <div
                        key={s.iso}
                        style={{
                          flex: 1,
                          minWidth: 104,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 800 }}>{s.head}</span>
                        <span
                          style={{
                            fontSize: 10,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: ".4px",
                          }}
                        >
                          {s.sub}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filas de colaboradores */}
                {view.rows.map((r) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        ...infoCol,
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        paddingRight: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 11,
                          height: 11,
                          borderRadius: 4,
                          background: roleColor(r.role),
                          flex: "0 0 auto",
                        }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0 }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {r.name}
                        </span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.role}</span>
                      </div>
                      {r.mode === "virtual" && (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: 9,
                            fontWeight: 800,
                            color: "#7c3aed",
                            background: "#ede9fe",
                            padding: "1px 5px",
                            borderRadius: 5,
                            letterSpacing: ".4px",
                          }}
                        >
                          VIRTUAL
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flex: 1, gap: 8 }}>
                      {r.cells.map((cell) => {
                        const m = shiftMeta(cell.shift);
                        return (
                          <div
                            key={cell.key}
                            onClick={() => rotate(r.id, cell.iso)}
                            title="Clic para rotar el turno"
                            style={{
                              ...cellBase,
                              background: m.bg,
                              color: m.fg,
                              border: "1px solid " + m.border,
                            }}
                          >
                            <span>{m.label}</span>
                            {m.sub && (
                              <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.65 }}>
                                {m.sub}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Separador */}
                <div style={{ height: 1, background: "#eef2f6", margin: "6px 0" }} />

                {/* Cobertura AM / PM */}
                {view.coverageRows.map((cr) => (
                  <div key={cr.block} style={{ display: "flex", alignItems: "stretch" }}>
                    <div
                      style={{
                        ...infoCol,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 800 }}>{cr.label}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{cr.sub}</span>
                    </div>
                    <div style={{ display: "flex", flex: 1, gap: 8 }}>
                      {cr.cells.map((cc) => (
                        <div
                          key={cc.iso}
                          style={{
                            flex: 1,
                            minWidth: 104,
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                            padding: 8,
                            borderRadius: 9,
                            background: cc.ok ? "#f0fdf4" : "#fef2f2",
                            border: "1px solid " + (cc.ok ? "#bbf7d0" : "#fecaca"),
                          }}
                        >
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {cc.roles.map((d) => (
                              <span
                                key={d.key}
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: "2px 6px",
                                  borderRadius: 6,
                                  background: d.ok ? d.color : "#fee2e2",
                                  color: d.ok ? "#fff" : "#dc2626",
                                  border: d.ok ? "1px solid transparent" : "1px dashed #f87171",
                                }}
                              >
                                {d.abbr}
                              </span>
                            ))}
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 6,
                              alignSelf: "flex-start",
                              background: cc.physOk ? accent : "#fee2e2",
                              color: cc.physOk ? "#fff" : "#dc2626",
                              border: cc.physOk ? "1px solid transparent" : "1px dashed #f87171",
                            }}
                          >
                            {cc.physOk ? "Físico" : "Sin físico"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Leyenda de roles */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginTop: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                    }}
                  >
                    Roles:
                  </span>
                  {ROLES.map((r) => (
                    <span
                      key={r.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{ width: 10, height: 10, borderRadius: 3, background: r.color }}
                      />
                      {r.abbr} · {r.key}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {isPending && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            background: "#0f172a",
            color: "#fff",
            fontSize: 12,
            padding: "8px 14px",
            borderRadius: 20,
            opacity: 0.9,
          }}
        >
          Guardando…
        </div>
      )}

      {alertsOpen && <AlertsModal view={view} onClose={() => setAlertsOpen(false)} />}
      {editing && (
        <CollaboratorModal accent={accent} editing={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

// ── Modal de alertas ─────────────────────────────────────────────────────────
function AlertsModal({
  view,
  onClose,
}: {
  view: ReturnType<typeof buildPlannerView>;
  onClose: () => void;
}) {
  return (
    <Overlay onClose={onClose}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800 }}>Alertas de cobertura</div>
        <button onClick={onClose} aria-label="Cerrar" style={iconClose}>
          ×
        </button>
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        {view.alertOk
          ? "Sin alertas"
          : `${view.alertCount} bloque${view.alertCount === 1 ? "" : "s"} con alertas`}
      </div>

      {view.alertOk ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            padding: "28px 12px",
            background: "#f0fdf4",
            borderRadius: 12,
            border: "1px solid #bbf7d0",
          }}
        >
          <div style={{ fontSize: 30 }}>✓</div>
          <div style={{ fontWeight: 800, color: "#166534" }}>Todos los bloques están cubiertos</div>
          <div style={{ fontSize: 12, color: "#15803d", textAlign: "center", maxWidth: 360 }}>
            Cada turno AM y PM del mes tiene al menos un colaborador por rol y presencia física.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {view.alerts.map((al, i) => (
            <div key={i} style={{ border: "1px solid #fecaca", borderRadius: 12, overflow: "hidden" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "#fef2f2",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#991b1b" }}>{al.title}</div>
                  <div style={{ fontSize: 11, color: "#b91c1c" }}>{al.time}</div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 9px",
                    borderRadius: 20,
                    background: "#fee2e2",
                    color: "#dc2626",
                  }}
                >
                  {al.count}
                </span>
              </div>
              <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                {al.issues.map((is, j) => (
                  <div key={j}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{is.problem}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                      💡 Sugerencia: {is.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Overlay>
  );
}

// ── Modal de colaborador (crear / editar) ────────────────────────────────────
function CollaboratorModal({
  accent,
  editing,
  onClose,
}: {
  accent: string;
  editing: Editing;
  onClose: () => void;
}) {
  const [name, setName] = useState(editing.name);
  const [role, setRole] = useState<RoleKey>(editing.role);
  const [mode, setMode] = useState<Mode>(editing.mode);
  const [pending, setPending] = useState(false);

  const modeBtn = (active: boolean): CSSProperties => ({
    flex: 1,
    padding: 11,
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    border: "1px solid " + (active ? accent : "#e2e8f0"),
    background: active ? accent : "#fff",
    color: active ? "#fff" : "#475569",
  });

  // Llamada explícita a la Server Action (no dependemos del `action` del form).
  async function handleSave() {
    if (!name.trim() || pending) return;
    setPending(true);
    try {
      const fd = new FormData();
      if (editing.id != null) fd.set("id", String(editing.id));
      fd.set("name", name.trim());
      fd.set("role", role);
      fd.set("mode", mode);
      await saveCollaboratorAction(fd);
      onClose();
    } catch {
      alert("No se pudo guardar el colaborador. Intenta de nuevo.");
      setPending(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>
        {editing.id != null ? "Editar colaborador" : "Nuevo colaborador"}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            placeholder="Nombre del colaborador"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>Rol</span>
          <select value={role} onChange={(e) => setRole(e.target.value as RoleKey)} style={inputStyle}>
            {ROLES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.key}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>Modalidad</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={modeBtn(mode === "fisico")} onClick={() => setMode("fisico")}>
              Físico
            </button>
            <button type="button" style={modeBtn(mode === "virtual")} onClick={() => setMode("virtual")}>
              Virtual
            </button>
          </div>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            Los virtuales no cuentan como presencia física en un bloque.
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              background: "#fff",
              color: "#475569",
              border: "1px solid #e2e8f0",
              padding: 12,
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || !name.trim()}
            style={{
              flex: 1,
              background: accent,
              color: "#fff",
              border: "none",
              padding: 12,
              borderRadius: 10,
              fontWeight: 700,
              cursor: pending ? "default" : "pointer",
              opacity: pending || !name.trim() ? 0.6 : 1,
            }}
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 22,
          width: "100%",
          maxWidth: 460,
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(2,6,23,.4)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 700, color: "#475569" };
const inputStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 14,
  color: "#0f172a",
  outline: "none",
  background: "#fff",
};
const iconClose: CSSProperties = {
  background: "#f1f5f9",
  border: "none",
  width: 30,
  height: 30,
  borderRadius: 8,
  fontSize: 18,
  cursor: "pointer",
  color: "#475569",
  lineHeight: 1,
};
