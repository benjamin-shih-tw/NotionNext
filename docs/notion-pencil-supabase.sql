create table if not exists public.notion_pencil_canvases (
  id uuid primary key,
  drawing jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.notion_pencil_canvases enable row level security;

create or replace function public.save_notion_pencil_canvas(
  canvas_id uuid,
  expected_version integer,
  next_drawing jsonb
)
returns integer
language plpgsql
security invoker
as $$
declare new_version integer;
begin
  if expected_version = 0 then
    insert into public.notion_pencil_canvases (id, drawing, version)
    values (canvas_id, next_drawing, 1)
    on conflict do nothing
    returning version into new_version;
  else
    update public.notion_pencil_canvases
      set drawing = next_drawing, version = version + 1, updated_at = now()
      where id = canvas_id and version = expected_version
      returning version into new_version;
  end if;
  return new_version;
end;
$$;

revoke all on function public.save_notion_pencil_canvas(uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.save_notion_pencil_canvas(uuid, integer, jsonb) to service_role;
