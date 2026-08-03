-- ============================================================
-- RTIC Tablero de Avance — Esquema Supabase
-- Pegar este bloque completo en Supabase → SQL Editor → Run.
-- ============================================================

-- 1. Indicadores: un registro por KPI de cada monitor
create table if not exists indicadores (
  id             uuid primary key default gen_random_uuid(),
  isla           text    not null,                    -- "Isla 1"
  categoria      text    not null,                    -- "OCTG + Cabezales"
  monitor        integer not null check (monitor in (1, 2)),
  monitor_titulo text    not null,                    -- qué proyecta el monitor
  nombre         text    not null,
  rotacion       boolean not null default false,      -- true = carrusel (ámbar)
  estado         text    not null default 'pendiente'
                 check (estado in ('pendiente','curso','completada','riesgo')),
  progreso       integer not null default 0 check (progreso between 0 and 100),
  responsable    text    not null default '',
  comentario     text    not null default '',
  orden          integer not null unique,
  updated_at     timestamptz not null default now()
);

-- 2. Cortes semanales: una foto del avance por semana (historial del gráfico)
create table if not exists cortes_semanales (
  id            uuid primary key default gen_random_uuid(),
  semana        integer not null unique check (semana between 1 and 104),
  fecha         date    not null,
  avance_global numeric(5,1) not null,
  completados   integer not null default 0,
  en_curso      integer not null default 0,
  pendientes    integer not null default 0,
  en_riesgo     integer not null default 0,
  nota          text    not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists idx_indicadores_orden on indicadores(orden);

-- 3. Trigger de updated_at
create or replace function update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on indicadores;
create trigger set_updated_at
  before update on indicadores
  for each row execute function update_modified_column();

-- 4. Row Level Security — lectura/escritura pública para que la app funcione ya
--    (más adelante se puede restringir la escritura con Supabase Auth)
alter table indicadores     enable row level security;
alter table cortes_semanales enable row level security;

drop policy if exists "todo indicadores" on indicadores;
create policy "todo indicadores" on indicadores
  for all using (true) with check (true);

drop policy if exists "todo cortes" on cortes_semanales;
create policy "todo cortes" on cortes_semanales
  for all using (true) with check (true);

-- 5. Realtime: publicar cambios para que el tablero se actualice en vivo
alter publication supabase_realtime add table indicadores;
alter publication supabase_realtime add table cortes_semanales;

-- 6. Seed: los 39 indicadores del layout de 12 pantallas
insert into indicadores (isla, categoria, monitor, monitor_titulo, nombre, rotacion, orden) values
  -- Isla 1 · OCTG + Cabezales
  ('Isla 1','OCTG + Cabezales',1,'Volumen y Tipo Casing/Tubing','TN facturadas por mes',false,1),
  ('Isla 1','OCTG + Cabezales',1,'Volumen y Tipo Casing/Tubing','Tendencia mensual',false,2),
  ('Isla 1','OCTG + Cabezales',1,'Volumen y Tipo Casing/Tubing','Robusto / FAT ext. / SLIM',false,3),
  ('Isla 1','OCTG + Cabezales',1,'Volumen y Tipo Casing/Tubing','8% desc. ponderado',false,4),
  ('Isla 1','OCTG + Cabezales',2,'TCO + Market Share Cabezales y Tapones','TCO',false,5),
  ('Isla 1','OCTG + Cabezales',2,'TCO + Market Share Cabezales y Tapones','Market Share',false,6),
  ('Isla 1','OCTG + Cabezales',2,'TCO + Market Share Cabezales y Tapones','Vencimientos',true,7),
  -- Isla 2 · Rigs
  ('Isla 2','Rigs',1,'TCO + Score de proveedores','TCO normalizado',false,8),
  ('Isla 2','Rigs',1,'TCO + Score de proveedores','Score de proveedores',false,9),
  ('Isla 2','Rigs',1,'TCO + Score de proveedores','Market Share asignado',true,10),
  ('Isla 2','Rigs',2,'Concentración de Mercado — Oferta y Demanda','Concentración + HHI',false,11),
  ('Isla 2','Rigs',2,'Concentración de Mercado — Oferta y Demanda','Cruce oferta–demanda',false,12),
  ('Isla 2','Rigs',2,'Concentración de Mercado — Oferta y Demanda','Vencimientos',true,13),
  -- Isla 3 · OFS-20 (E-20)
  ('Isla 3','OFS-20 (E-20)',1,'TCO + Score de proveedores — consolidado','TCO normalizado',false,14),
  ('Isla 3','OFS-20 (E-20)',1,'TCO + Score de proveedores — consolidado','Score de proveedores',false,15),
  ('Isla 3','OFS-20 (E-20)',1,'TCO + Score de proveedores — consolidado','Market Share asignado',true,16),
  ('Isla 3','OFS-20 (E-20)',2,'Concentración — Oferta y Demanda — consolidado','Concentración + HHI',false,17),
  ('Isla 3','OFS-20 (E-20)',2,'Concentración — Oferta y Demanda — consolidado','Cruce oferta–demanda',false,18),
  ('Isla 3','OFS-20 (E-20)',2,'Concentración — Oferta y Demanda — consolidado','Vencimientos',true,19),
  -- Isla 4 · Completion
  ('Isla 4','Completion',1,'TCO + Score de proveedores','TCO normalizado',false,20),
  ('Isla 4','Completion',1,'TCO + Score de proveedores','Score de proveedores',false,21),
  ('Isla 4','Completion',1,'TCO + Score de proveedores','Market Share asignado',true,22),
  ('Isla 4','Completion',2,'Concentración de Mercado — Oferta y Demanda','Concentración + HHI',false,23),
  ('Isla 4','Completion',2,'Concentración de Mercado — Oferta y Demanda','Cruce oferta–demanda',false,24),
  ('Isla 4','Completion',2,'Concentración de Mercado — Oferta y Demanda','Vencimientos',true,25),
  -- Isla 5 · OFS-30 (E-30)
  ('Isla 5','OFS-30 (E-30)',1,'TCO + Score de proveedores — consolidado','TCO normalizado',false,26),
  ('Isla 5','OFS-30 (E-30)',1,'TCO + Score de proveedores — consolidado','Score de proveedores',false,27),
  ('Isla 5','OFS-30 (E-30)',1,'TCO + Score de proveedores — consolidado','Market Share asignado',true,28),
  ('Isla 5','OFS-30 (E-30)',2,'Concentración — Oferta y Demanda — consolidado','Concentración + HHI',false,29),
  ('Isla 5','OFS-30 (E-30)',2,'Concentración — Oferta y Demanda — consolidado','Cruce oferta–demanda',false,30),
  ('Isla 5','OFS-30 (E-30)',2,'Concentración — Oferta y Demanda — consolidado','Vencimientos',true,31),
  -- Isla 6 · Proyectos
  ('Isla 6','Proyectos',1,'Plan de Compras + Proyectos','Plan de Compras',false,32),
  ('Isla 6','Proyectos',1,'Plan de Compras + Proyectos','Avance vs. plan',false,33),
  ('Isla 6','Proyectos',1,'Plan de Compras + Proyectos','Toyota Well',true,34),
  ('Isla 6','Proyectos',1,'Plan de Compras + Proyectos','RMA',true,35),
  ('Isla 6','Proyectos',1,'Plan de Compras + Proyectos','Exploratorios',true,36),
  ('Isla 6','Proyectos',1,'Plan de Compras + Proyectos','LNG',true,37),
  ('Isla 6','Proyectos',2,'Costo Pozo + Rendimiento de Compradores','Costo por pozo (USD/m lateral)',false,38),
  ('Isla 6','Proyectos',2,'Costo Pozo + Rendimiento de Compradores','Rendimiento de compradores',false,39)
on conflict (orden) do nothing;
