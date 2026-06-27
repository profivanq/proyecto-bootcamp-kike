import { neon } from "@neondatabase/serverless";

// Cadena de conexión a Neon. En Vercel, la integración de Neon (Storage) crea
// DATABASE_URL automáticamente. En local se lee de .env.local.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  "";

export const hasDatabase = Boolean(connectionString);

if (!hasDatabase) {
  console.warn(
    "[db] No se encontró DATABASE_URL. Conecta Neon en Vercel (Storage) o define .env.local."
  );
}

// Inicialización perezosa: NO llamamos a neon() al importar (lanzaría si la
// cadena está vacía, rompiendo el build). El cliente se crea en el primer uso.
let client: ReturnType<typeof neon> | null = null;

export function getSql(): ReturnType<typeof neon> {
  if (!connectionString) {
    throw new Error(
      "Base de datos no configurada: falta DATABASE_URL. Conecta Neon en Vercel (Storage)."
    );
  }
  if (!client) client = neon(connectionString);
  return client;
}
