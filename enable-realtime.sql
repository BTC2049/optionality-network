do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'partnership_requests'
  ) then
    alter publication supabase_realtime add table public.partnership_requests;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'partnership_messages'
  ) then
    alter publication supabase_realtime add table public.partnership_messages;
  end if;
end $$;
