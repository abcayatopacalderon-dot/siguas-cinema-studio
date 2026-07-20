-- Esquema para Cauce — Estudio Siguas
-- Ejecuta esto en Supabase: Project > SQL Editor > New query

create table if not exists scenes (
  id uuid primary key default gen_random_uuid(),
  number int not null,
  title text default 'Escena sin título',
  prompt text default '',
  negative_prompt text default '',
  duration text default '8',
  aspect text default '16:9',
  reference_image_urls text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists takes (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid references scenes(id) on delete cascade,
  status text default 'processing', -- processing | done | error
  operation_name text,              -- id de la operación de Veo mientras se genera
  video_url text,                   -- URL final del video (en Supabase Storage o el URI de Google)
  duration text,
  aspect text,
  cost_estimate numeric(10,2),
  error_message text,
  created_at timestamptz default now()
);

create table if not exists authorship_log (
  id uuid primary key default gen_random_uuid(),
  take_id uuid references takes(id) on delete cascade,
  model_used text default 'veo-3.1-generate-001',
  prompt_used text,
  enhanced_by_claude boolean default false,
  generated_at timestamptz default now()
);

-- Índices útiles
create index if not exists idx_takes_scene_id on takes(scene_id);

-- RLS (ajusta según si esto es multiusuario o solo para tu equipo)
alter table scenes enable row level security;
alter table takes enable row level security;
alter table authorship_log enable row level security;

-- Política simple: solo el rol autenticado del proyecto puede leer/escribir.
-- Si es un proyecto de un solo usuario/equipo cerrado, esto es suficiente.
create policy "team access scenes" on scenes for all using (true) with check (true);
create policy "team access takes" on takes for all using (true) with check (true);
create policy "team access authorship" on authorship_log for all using (true) with check (true);
