# Planificador de Sábados · iAcademy

Aplicación **Next.js 15** (App Router) para planificar los turnos de los sábados del
equipo de iAcademy, con persistencia en **Postgres (Neon)** sobre Vercel.

Antes era una página HTML estática (demo con datos en memoria). Ahora es una app
real: los colaboradores, sus turnos y la configuración viven en una base de datos.

## Funcionalidades

- **Colaboradores**: crear, editar y eliminar (rol y modalidad físico/virtual).
- **Asignación de turnos** por cada sábado del mes: clic en una celda para rotar
  `AM → PM → Completo → Libre`.
- **Cobertura**: valida que cada bloque AM/PM tenga los 4 roles presentes y al menos
  una persona física, con alertas y sugerencias accionables.
- **Navegación por mes** y **exportación a JPG**.

## Arquitectura

| Capa | Archivo |
|------|---------|
| Conexión a Neon | `lib/db.ts` |
| Esquema + datos demo (auto-inicialización) | `lib/init.ts` |
| Lógica de cobertura (pura) | `lib/coverage.ts` |
| Consultas y mutaciones SQL | `lib/queries.ts` |
| Server Actions | `app/actions.ts` |
| Interfaz | `components/Planner.tsx` |

La base de datos se **auto-inicializa**: la primera vez que la app se conecta crea
las tablas (`roles`, `collaborators`, `shift_assignments`, `planner_settings`) y
siembra los datos de demo si están vacías.

## Esquema de la base de datos

- `roles(key, color, abbr, sort_order)`
- `collaborators(id, name, role → roles.key, mode, created_at, updated_at)`
- `shift_assignments(id, collaborator_id → collaborators.id, work_date, shift, …)`
  con `UNIQUE(collaborator_id, work_date)`.
- `planner_settings(id=1, require_physical, accent)`

## Puesta en marcha en Vercel + Neon

1. En el proyecto de Vercel → pestaña **Storage** → **Create Database** → **Neon**.
2. Conéctalo al proyecto; Vercel crea la variable `DATABASE_URL` automáticamente.
3. **Redeploy**. Al primer acceso, la app crea las tablas y carga los datos de demo.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # pega tu DATABASE_URL de Neon
npm run db:setup             # (opcional) crea tablas + datos demo
npm run dev                  # http://localhost:3000
```
