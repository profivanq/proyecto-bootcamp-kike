// Inicializa el esquema y siembra los datos de demo manualmente.
// Uso local:  npm run db:setup   (lee DATABASE_URL de .env.local)
import { ensureDb } from "../lib/init";

async function main() {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error("✖ Falta DATABASE_URL. Crea un archivo .env.local con la cadena de Neon.");
    process.exit(1);
  }
  console.log("→ Creando tablas y sembrando datos de demo…");
  await ensureDb();
  console.log("✓ Base de datos lista (tablas + datos de demo).");
  process.exit(0);
}

main().catch((err) => {
  console.error("✖ Error inicializando la base de datos:", err);
  process.exit(1);
});
