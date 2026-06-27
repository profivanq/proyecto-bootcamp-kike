// Aviso seguro: nunca muestra el mensaje crudo del error (podría filtrar host o
// usuario de la base). Distingue "falta configurar" de "fallo de conexión".
export default function SetupNotice({ configured }: { configured: boolean }) {
  return (
    <div className="shell" style={{ maxWidth: 720 }}>
      <div style={{ padding: "20px 24px", background: "#0e7490", color: "#fff" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Planificador de Sábados · iAcademy</h1>
        <p style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
          {configured ? "No se pudo conectar con la base de datos" : "Falta conectar la base de datos"}
        </p>
      </div>
      <div style={{ padding: 24, color: "#334155", fontSize: 14, lineHeight: 1.6 }}>
        {configured ? (
          <p>
            La base de datos está configurada pero no respondió. Revisa que el proyecto de Neon esté
            activo y que la variable <code>DATABASE_URL</code> en Vercel sea correcta; luego vuelve a
            cargar la página. (Los detalles del error quedaron registrados en los logs del servidor.)
          </p>
        ) : (
          <>
            <p style={{ marginBottom: 14 }}>
              La aplicación está desplegada correctamente, pero todavía no tiene una base de datos
              Postgres conectada. Para activarla:
            </p>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>
                Abre tu proyecto en Vercel → pestaña <strong>Storage</strong>.
              </li>
              <li>
                Clic en <strong>Create Database</strong> → elige{" "}
                <strong>Neon (Serverless Postgres)</strong>.
              </li>
              <li>Acepta el plan gratuito y conéctalo a este proyecto.</li>
              <li>
                Vercel creará la variable <code>DATABASE_URL</code> automáticamente. Vuelve a
                desplegar (Redeploy) y esta pantalla se reemplazará por el planificador con sus datos
                de demo.
              </li>
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
