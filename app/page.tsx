import { getPlannerData } from "@/lib/queries";
import { hasDatabase } from "@/lib/db";
import Planner from "@/components/Planner";
import SetupNotice from "@/components/SetupNotice";

// Siempre dinámico: los datos viven en la base de datos y cambian con cada acción.
export const dynamic = "force-dynamic";

// Mes/año inicial: el del dato más reciente (así abre donde hay información),
// con la fecha actual como respaldo si no hay asignaciones.
function initialMonthYear(assignments: Record<string, string>): { year: number; month: number } {
  const isos = Object.keys(assignments)
    .map((k) => k.split("|")[1])
    .filter(Boolean)
    .sort();
  const latest = isos.at(-1);
  if (latest) {
    return { year: Number(latest.slice(0, 4)), month: Number(latest.slice(5, 7)) - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export default async function Home() {
  let data;
  try {
    data = await getPlannerData();
  } catch (err) {
    // No exponemos detalles del error al navegador (pueden incluir host/usuario
    // de la base). Lo registramos en el servidor y mostramos un aviso seguro.
    console.error("[planner] No se pudo cargar la base de datos:", err);
    return (
      <main className="page">
        <SetupNotice configured={hasDatabase} />
      </main>
    );
  }

  const { year, month } = initialMonthYear(data.assignments);

  return (
    <main className="page">
      <Planner
        collaborators={data.collaborators}
        assignments={data.assignments}
        requirePhysical={data.requirePhysical}
        accent={data.accent}
        initialYear={year}
        initialMonth={month}
      />
    </main>
  );
}
