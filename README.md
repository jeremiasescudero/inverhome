# Inverhome — Sistema de Gestión Inmobiliaria (demo)

Demo visual y navegable de un sistema de gestión integral para inmobiliarias.
Todo funciona con **datos ficticios en memoria**: no hay backend, base de datos,
autenticación ni persistencia. Los cambios que se hacen en la interfaz viven
en la sesión y se pierden al recargar (o al usar "Restablecer datos de la demo"
en el menú de usuario).

## Cómo correrla

```bash
npm install
npm run dev        # http://localhost:5173
```

Otros comandos:

| Comando             | Qué hace                                        |
| ------------------- | ----------------------------------------------- |
| `npm run build`     | Typecheck + build de producción en `dist/`      |
| `npm run preview`   | Sirve el build de producción                    |
| `npm run test`      | Tests de flujos críticos (Vitest + Testing Library) |
| `npm run lint`      | Oxlint                                          |
| `npm run validate`  | lint + build + test (gate de calidad)           |

## Qué se puede recorrer

| Módulo            | Ruta                      | Incluye                                                                 |
| ----------------- | ------------------------- | ----------------------------------------------------------------------- |
| Dashboard         | `/dashboard`              | KPIs, alertas, próximos eventos, actividad reciente                     |
| Propiedades       | `/propiedades`            | Tabla/cards, búsqueda, filtros, orden, detalle, alta y edición          |
| Clientes          | `/clientes`               | Listado por rol, detalle con propiedades, operaciones, leads, visitas   |
| Leads             | `/leads`                  | Kanban con drag & drop, listado, detalle, cambio de etapa               |
| Visitas           | `/visitas`                | Agenda por día, historial, detalle y cambio de estado                   |
| Operaciones       | `/operaciones`            | Listado, detalle con stepper, avance/cancelación de estado              |
| Alquileres        | `/alquileres`             | Contratos por vencimiento, detalle con pagos, liquidaciones y documentos|
| Finanzas          | `/finanzas`               | Resumen, gráfico ingresos/egresos, comisiones, pagos, liquidaciones     |
| Documentos        | `/documentos`             | Filtros por tipo/estado/entidad, vencimientos próximos                  |
| Reportes          | `/reportes`               | Propiedades, comercial (embudo, agentes) y financiero                   |
| Auditoría         | `/auditoria`              | Eventos con diff antes/después, filtros por usuario/acción/entidad/fecha|
| Usuarios          | `/usuarios`               | Alta, cambio de rol, bloqueo/desactivación, permisos por rol            |
| Configuración     | `/configuracion`          | Parámetros de la empresa y lineamientos de seguridad                    |

En el header hay **búsqueda global** (`Ctrl/Cmd + K`), **notificaciones**
derivadas de los datos y el **selector de usuario**, que permite ver la demo con
cada rol (Administrador, Gerente, Agente, Administración, Contador). La barra
lateral y las rutas se filtran según el rol; entrar por URL a un módulo sin
permiso muestra un estado "Acceso restringido".

## Arquitectura

```text
UI (features/*, components/ui)
  ↓
Hooks (useAsync, useDebounced) / estado local
  ↓
Services (services/*)   ← única capa que toca los datos; devuelve Promises
  ↓
Mock DB en memoria (mocks/db.ts) + datos de semilla (mocks/data/*)
```

- `src/types/` — modelo de dominio (Property, Person, Lead, Visit, Operation,
  Rental, Payment, Settlement, StoredDocument, AuditEvent, User).
- `src/services/` — servicios con la firma que tendría un cliente HTTP.
  Reemplazar el mock por `fetch` no requiere tocar páginas ni hooks.
- `src/lib/labels.ts` — etiquetas y tonos de todos los estados (única fuente).
- `src/lib/permissions.ts` — matriz RBAC conceptual usada por sidebar, rutas y
  acciones. Ocultar un botón no es seguridad: la API real debe revalidar.
- `src/app/` — sesión demo, layout, navegación, guard de permisos, toasts.
- `src/components/ui/` — primitivas reutilizables (DataTable, Drawer, Modal,
  Badge, Tabs, Timeline, FileCard, KpiCard, estados vacío/carga/error…).
- `src/components/charts/` — gráficos con paleta validada.

La fecha de referencia de la demo es `2026-09-16` (`DEMO_TODAY`), lo que
mantiene coherentes vencimientos, alertas y agenda.

Las decisiones de diseño relevantes están en [docs/DECISIONS.md](docs/DECISIONS.md).

## Fuera de alcance (a propósito)

Backend, base de datos, autenticación/autorización reales, pagos, integraciones
(WhatsApp, email, portales, AFIP), firma digital, almacenamiento de archivos.
Cuando ayuda a entender el producto, se representan visualmente como mock.
