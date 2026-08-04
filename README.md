# RTIC — Tablero de Avance

Tablero web de seguimiento semanal de la implementación de indicadores del **RTIC Well Construction**: 6 islas · 12 monitores · indicadores con estado y progreso, con historial de cortes semanales.

## Stack

- **React 19 + Vite 6 + TypeScript**
- **Supabase** (Postgres + Realtime): tablas `indicadores` y `cortes_semanales`

## Puesta en marcha

1. Crear un proyecto en [Supabase](https://supabase.com) y ejecutar `supabase-schema.sql` en el SQL Editor (crea las tablas, activa realtime y precarga los 39 indicadores del layout de 12 pantallas).
2. Copiar las credenciales en `.env`:

   ```
   VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

3. Instalar y correr:

   ```bash
   npm install
   npm run dev
   ```

> Nota: requiere Node ≥ 20. Vite está pineado a v6 por compatibilidad con Node 22.9.

## Uso

- **Modo edición**: cambiar estado y progreso de cada indicador (se guarda solo, con sincronización en tiempo real entre pestañas/personas), agregar indicadores nuevos por monitor y eliminarlos.
- **Guardar corte semanal**: congela la foto de la semana (avance global + conteos) y agrega el punto al gráfico de evolución. Si ya existe un corte con la fecha de hoy, se actualiza ese mismo corte en lugar de crear uno nuevo. Los cortes guardados se pueden editar (fecha y % de avance) y borrar desde el mismo modo edición.
- **Filtros** por estado (completados / en curso / pendientes / en riesgo).

## Seguridad

Las políticas RLS del esquema son abiertas (lectura y escritura públicas) para simplificar la puesta en marcha. Antes de difundir la URL públicamente, restringir la escritura (por ejemplo con Supabase Auth).
