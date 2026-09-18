# Decisiones de arquitectura (ADR)

Registro de decisiones relevantes de la demo, para que nadie las revierta por
accidente. Formato: contexto → decisión → consecuencias.

---

## ADR-001 — Base de datos en memoria detrás de servicios asíncronos

**Fecha:** 2026-09-16 · **Estado:** aceptada

**Contexto.** La demo no tiene backend, pero debe poder evolucionar a un
sistema real sin reescribir la interfaz.

**Decisión.** Los datos viven en `src/mocks/db.ts` (copia estructurada de las
semillas) y sólo los servicios de `src/services/` la tocan. Cada servicio
devuelve `Promise` y falla con `ApiError`, con una latencia artificial corta en
desarrollo para que los estados de carga sean reales.

**Consecuencias.** Reemplazar el mock por HTTP es un cambio contenido en
`services/`. Las mutaciones (crear propiedad, mover lead, registrar pago) son
reales dentro de la sesión y se pierden al recargar, que es el alcance
documentado. `resetDb()` restablece el estado (menú de usuario y tests).

---

## ADR-002 — RBAC conceptual aplicado en sidebar, rutas y acciones

**Fecha:** 2026-09-16 · **Estado:** aceptada

**Contexto.** El spec exige seguridad por diseño aunque no haya autenticación.

**Decisión.** `src/lib/permissions.ts` define la matriz rol → permisos. La
sesión demo (`SessionContext`) expone `can()`; el sidebar filtra entradas, cada
ruta está envuelta en `RequirePermission` y las acciones de escritura se
ocultan según permiso. El guard muestra un estado "Acceso restringido" en lugar
de redirigir, para que quien revisa la demo entienda el motivo.

**Consecuencias.** El selector de usuario permite validar la experiencia de
cada rol. Queda explícito en código y UI que ocultar un control no es
seguridad: la API real debe validar cada permiso.

---

## ADR-003 — Fecha de referencia fija para el dataset

**Fecha:** 2026-09-16 · **Estado:** aceptada

**Contexto.** Vencimientos, alertas, agenda y notificaciones dependen de "hoy".
Si se usara la fecha real, la demo se degradaría con el tiempo.

**Decisión.** `DEMO_TODAY = '2026-09-16'` en `mocks/db.ts`; los servicios que
calculan relativos aceptan `today` como parámetro con ese default.

**Consecuencias.** Los datos se ven coherentes en cualquier momento. Las
fechas de las mutaciones hechas en la sesión usan la fecha real (auditoría),
lo cual es aceptable para la demo.

---

## ADR-004 — Cotización USD/ARS de referencia para consolidar finanzas

**Fecha:** 2026-09-16 · **Estado:** aceptada

**Contexto.** Las ventas se cotizan en USD y los alquileres en ARS. Los
reportes financieros necesitan una única serie.

**Decisión.** `MOCK_USD_ARS` en `finance.service.ts` convierte comisiones en
USD a pesos. Toda pantalla que lo use lo aclara como valor de referencia.

**Consecuencias.** Gráficos legibles con una sola moneda. El sistema real debe
guardar la cotización vigente en cada operación en lugar de una constante.

---

## ADR-005 — Estados nunca comunicados sólo por color

**Fecha:** 2026-09-16 · **Estado:** aceptada

**Contexto.** Accesibilidad y consistencia visual (spec §25).

**Decisión.** `src/lib/labels.ts` es la única fuente de etiqueta + tono por
estado. `StatusBadge` siempre muestra texto e ícono; los gráficos usan la
paleta validada de `components/charts/palette.ts` y muestran valores en texto.

**Consecuencias.** Agregar un estado implica agregarlo en `labels.ts` y queda
consistente en todos los módulos.

---

## ADR-006 — Formularios inicializados desde props, sin sincronización por efectos

**Fecha:** 2026-09-18 · **Estado:** aceptada

**Contexto.** El formulario de propiedad (alta/edición) necesita datos
cargados de forma asíncrona (propiedad existente, propietarios, agentes).

**Decisión.** La página carga los datos y recién entonces monta el formulario
(`<PropertyForm key={id} initial={…}>`), que inicializa su estado directamente.
No se usa `useEffect` + `setState` para copiar props a estado.

**Consecuencias.** Sin renders en cascada ni estados intermedios inconsistentes;
el patrón queda como referencia para futuros formularios (usuarios, clientes).
