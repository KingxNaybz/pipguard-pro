-- Helper trigger function for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ bot_state (singleton per user) ============
create table public.bot_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric not null default 0,
  equity numeric not null default 0,
  margin numeric not null default 0,
  free_margin numeric not null default 0,
  currency text not null default 'USD',
  halted boolean not null default false,
  halt_reason text,
  consecutive_losses int not null default 0,
  daily_pl numeric not null default 0,
  daily_drawdown numeric not null default 0,
  trades_today int not null default 0,
  wins_today int not null default 0,
  losses_today int not null default 0,
  scan_count bigint not null default 0,
  last_heartbeat timestamptz,
  bot_version text,
  updated_at timestamptz not null default now()
);
create trigger bot_state_updated before update on public.bot_state
  for each row execute function public.set_updated_at();

alter table public.bot_state enable row level security;
create policy "owner reads bot_state" on public.bot_state for select using (auth.uid() = user_id);
create policy "owner writes bot_state" on public.bot_state for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ positions ============
create table public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticket bigint not null,
  symbol text not null,
  side text not null check (side in ('buy','sell')),
  lots numeric not null,
  entry numeric not null,
  sl numeric,
  tp numeric,
  current_price numeric,
  profit numeric not null default 0,
  swap numeric not null default 0,
  commission numeric not null default 0,
  opened_at timestamptz not null,
  updated_at timestamptz not null default now(),
  unique(user_id, ticket)
);
create index positions_user_idx on public.positions(user_id);
create trigger positions_updated before update on public.positions
  for each row execute function public.set_updated_at();
alter table public.positions enable row level security;
create policy "owner positions" on public.positions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ trades (closed history) ============
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticket bigint not null,
  symbol text not null,
  side text not null check (side in ('buy','sell')),
  lots numeric not null,
  entry numeric not null,
  exit numeric not null,
  sl numeric,
  tp numeric,
  pips numeric not null default 0,
  profit numeric not null default 0,
  win boolean not null default false,
  signal_strength int,
  opened_at timestamptz not null,
  closed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(user_id, ticket)
);
create index trades_user_closed_idx on public.trades(user_id, closed_at desc);
create index trades_user_symbol_idx on public.trades(user_id, symbol);
alter table public.trades enable row level security;
create policy "owner trades" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ signals (latest per pair) ============
create table public.signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  side text check (side in ('buy','sell','none')),
  strength int not null default 0,
  indicators jsonb not null default '{}'::jsonb,
  spread numeric,
  regime text,
  scanned_at timestamptz not null default now(),
  unique(user_id, symbol)
);
create index signals_user_idx on public.signals(user_id);
alter table public.signals enable row level security;
create policy "owner signals" on public.signals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ commands ============
create table public.commands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('close_all','close_profit','close_one','pause','resume','update_params','flatten_symbol')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','done','failed','cancelled')),
  result jsonb,
  created_at timestamptz not null default now(),
  picked_at timestamptz,
  completed_at timestamptz
);
create index commands_pending_idx on public.commands(user_id, status, created_at);
alter table public.commands enable row level security;
create policy "owner commands" on public.commands for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ bot_params (singleton per user) ============
create table public.bot_params (
  user_id uuid primary key references auth.users(id) on delete cascade,
  risk_percent numeric not null default 0.005,
  max_trades int not null default 5,
  min_signal_strength int not null default 4,
  min_rrr numeric not null default 1.8,
  daily_loss_limit numeric not null default 0.06,
  max_consecutive_losses int not null default 5,
  max_lot_size numeric not null default 0.02,
  max_spread_normal int not null default 30,
  max_spread_gold int not null default 50,
  scan_interval int not null default 180,
  sl_min numeric not null default 20,
  sl_max numeric not null default 80,
  atr_multiplier numeric not null default 1.5,
  gold_sl_multiplier numeric not null default 2.0,
  paused boolean not null default false,
  enabled_pairs text[] not null default array['EURUSD','GBPUSD','XAUUSD','GBPJPY','EURJPY','USDJPY','AUDUSD','USDCAD','NZDUSD','USDCHF','EURGBP'],
  version int not null default 1,
  updated_at timestamptz not null default now()
);
create trigger bot_params_updated before update on public.bot_params
  for each row execute function public.set_updated_at();
alter table public.bot_params enable row level security;
create policy "owner params" on public.bot_params for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ alerts ============
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  level text not null default 'info' check (level in ('info','success','warn','error')),
  message text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index alerts_user_created_idx on public.alerts(user_id, created_at desc);
alter table public.alerts enable row level security;
create policy "owner alerts" on public.alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ Realtime ============
alter publication supabase_realtime add table public.bot_state;
alter publication supabase_realtime add table public.positions;
alter publication supabase_realtime add table public.signals;
alter publication supabase_realtime add table public.commands;
alter publication supabase_realtime add table public.alerts;
alter publication supabase_realtime add table public.trades;
alter publication supabase_realtime add table public.bot_params;

alter table public.bot_state replica identity full;
alter table public.positions replica identity full;
alter table public.signals replica identity full;
alter table public.commands replica identity full;
alter table public.bot_params replica identity full;

-- ============ Auto-provision params + state on signup ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.bot_params (user_id) values (new.id) on conflict do nothing;
  insert into public.bot_state (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();