-- PULSO / Supabase: ejecutar UNA VEZ en un proyecto nuevo.
-- Las mediciones y series se consultan solo por el usuario propietario.
create schema if not exists pulso_private;
revoke all on schema pulso_private from public, anon, authenticated;

create table public.exercises (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique, name text not null, muscle text not null,
 equipment text not null, level text not null check(level in ('Inicial','Intermedio')),
 motion text not null, cue text not null, sets integer not null default 3 check(sets between 1 and 8),
 reps text not null default '8–12', created_at timestamptz not null default now()
);
create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 alias text not null check(length(alias) between 3 and 32),
 share_opt_in boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.routine_plans (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 60),
 days integer not null check(days between 1 and 7),
 focus text not null,
 level text not null check(level in ('Inicial','Intermedio')),
 created_at timestamptz not null default now()
);
create table public.routine_exercises (
 id uuid primary key default gen_random_uuid(),
 plan_id uuid not null references public.routine_plans(id) on delete cascade,
 exercise_id uuid not null references public.exercises(id),
 sort_order integer not null check(sort_order between 0 and 30),
 sets integer not null default 3 check(sets between 1 and 8),
 reps text not null, unique(plan_id,sort_order)
);
create table public.workout_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 workout_date date not null default current_date,
 routine_name text not null check(length(routine_name) between 1 and 70),
 created_at timestamptz not null default now(),
 unique(user_id,workout_date)
);
create table public.workout_sets (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.workout_sessions(id) on delete cascade,
 exercise_id uuid not null references public.exercises(id),
 set_number integer not null check(set_number between 1 and 100),
 reps integer not null check(reps between 1 and 100),
 weight_kg numeric(7,2) not null check(weight_kg between 0 and 1000),
 created_at timestamptz not null default now(),
 unique(session_id,exercise_id,set_number)
);
create table public.leaderboard_entries (
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 month_start date not null, days_count integer not null default 0 check(days_count between 0 and 31),
 primary key(user_id,month_start)
);
create index idx_plans_user on public.routine_plans(user_id);
create index idx_routine_exercises_exercise on public.routine_exercises(exercise_id);
create index idx_sessions_user_date on public.workout_sessions(user_id,workout_date desc);
create index idx_sets_session on public.workout_sets(session_id);
create index idx_sets_exercise on public.workout_sets(exercise_id);
create index idx_leaderboard_month on public.leaderboard_entries(month_start,days_count desc);

alter table public.exercises enable row level security;
alter table public.profiles enable row level security;
alter table public.routine_plans enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.leaderboard_entries enable row level security;

grant usage on schema public to anon,authenticated;
-- Supabase suele otorgar permisos de tabla por defecto a anon; revocarlos explícitamente.
revoke all on public.profiles,public.routine_plans,public.routine_exercises,public.workout_sessions,public.workout_sets,public.leaderboard_entries from anon;
revoke insert,update,delete on public.exercises from anon;
grant select on public.exercises to anon,authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select,insert,update,delete on public.routine_plans,public.routine_exercises,public.workout_sessions,public.workout_sets to authenticated;
grant select on public.leaderboard_entries to authenticated;
revoke insert,update,delete on public.exercises from anon,authenticated;
revoke insert,update,delete on public.leaderboard_entries from anon,authenticated;

create policy "catalog read" on public.exercises for select to anon,authenticated using(true);
create policy "profiles self or opted in" on public.profiles for select to authenticated using(user_id=(select auth.uid()) or share_opt_in=true);
create policy "profiles insert own" on public.profiles for insert to authenticated with check(user_id=(select auth.uid()));
create policy "profiles update own" on public.profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "plans own read" on public.routine_plans for select to authenticated using(user_id=(select auth.uid()));
create policy "plans own insert" on public.routine_plans for insert to authenticated with check(user_id=(select auth.uid()));
create policy "plans own update" on public.routine_plans for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "plans own delete" on public.routine_plans for delete to authenticated using(user_id=(select auth.uid()));
create policy "plan exercises own read" on public.routine_exercises for select to authenticated using(exists(select 1 from public.routine_plans p where p.id=plan_id and p.user_id=(select auth.uid())));
create policy "plan exercises own insert" on public.routine_exercises for insert to authenticated with check(exists(select 1 from public.routine_plans p where p.id=plan_id and p.user_id=(select auth.uid())));
create policy "plan exercises own update" on public.routine_exercises for update to authenticated using(exists(select 1 from public.routine_plans p where p.id=plan_id and p.user_id=(select auth.uid()))) with check(exists(select 1 from public.routine_plans p where p.id=plan_id and p.user_id=(select auth.uid())));
create policy "plan exercises own delete" on public.routine_exercises for delete to authenticated using(exists(select 1 from public.routine_plans p where p.id=plan_id and p.user_id=(select auth.uid())));
create policy "sessions own read" on public.workout_sessions for select to authenticated using(user_id=(select auth.uid()));
create policy "sessions own insert" on public.workout_sessions for insert to authenticated with check(user_id=(select auth.uid()));
create policy "sessions own delete" on public.workout_sessions for delete to authenticated using(user_id=(select auth.uid()));
create policy "sets own read" on public.workout_sets for select to authenticated using(exists(select 1 from public.workout_sessions s where s.id=session_id and s.user_id=(select auth.uid())));
create policy "sets own insert" on public.workout_sets for insert to authenticated with check(exists(select 1 from public.workout_sessions s where s.id=session_id and s.user_id=(select auth.uid())));
create policy "sets own delete" on public.workout_sets for delete to authenticated using(exists(select 1 from public.workout_sessions s where s.id=session_id and s.user_id=(select auth.uid())));
create policy "ranking optin read" on public.leaderboard_entries for select to authenticated using(exists(select 1 from public.profiles p where p.user_id=leaderboard_entries.user_id and p.share_opt_in=true));

-- Las funciones privilegiadas están fuera del esquema público expuesto.
create or replace function pulso_private.update_leaderboard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_month date;
begin
 if tg_op='DELETE' then
   v_user:=old.user_id; v_month:=date_trunc('month',old.workout_date)::date;
 else
   v_user:=new.user_id; v_month:=date_trunc('month',new.workout_date)::date;
 end if;
 if exists(select 1 from public.profiles where user_id=v_user) then
  insert into public.leaderboard_entries(user_id,month_start,days_count)
  values(v_user,v_month,(select count(distinct workout_date) from public.workout_sessions where user_id=v_user and date_trunc('month',workout_date)::date=v_month))
  on conflict(user_id,month_start) do update set days_count=excluded.days_count;
 end if;
 return null;
end $$;
revoke all on function pulso_private.update_leaderboard() from public,anon,authenticated;
create trigger recalc_leaderboard after insert or delete on public.workout_sessions
for each row execute function pulso_private.update_leaderboard();

create or replace function pulso_private.create_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(user_id,alias)
 values(new.id,'Atleta-'||substring(new.id::text from 1 for 8))
 on conflict(user_id) do nothing;
 return new;
end $$;
revoke all on function pulso_private.create_profile() from public,anon,authenticated;
create trigger pulso_new_user_profile after insert on auth.users
for each row execute function pulso_private.create_profile();

insert into public.exercises(slug,name,muscle,equipment,level,motion,cue,sets,reps) values
('sentadilla','Sentadilla','Piernas','Peso corporal','Inicial','squat','Pies firmes, rodillas acompañan los dedos y espalda estable.',3,'8–12'),
('flexiones','Flexiones de brazos','Pecho','Peso corporal','Inicial','push','Cuerpo alineado; apoyá las rodillas si necesitás una variante.',3,'6–12'),
('remo-mancuerna','Remo con mancuerna','Espalda','Mancuerna','Intermedio','row','Apoyate en un banco y llevá el codo hacia la cadera.',3,'8–12'),
('peso-muerto-rumano','Bisagra de cadera','Piernas','Mancuernas','Inicial','hinge','Cadera hacia atrás, rodillas levemente flexionadas, peso cerca del cuerpo.',3,'8–10'),
('press-hombros','Press de hombros','Hombros','Mancuernas','Intermedio','press','Empujá hacia arriba sin arquear excesivamente la espalda.',3,'8–12'),
('curl-biceps','Curl de bíceps','Bíceps','Mancuernas','Inicial','curl','Codos cerca del cuerpo, evitá balancear el torso.',3,'10–12'),
('extension-triceps','Extensión de tríceps','Tríceps','Mancuerna','Inicial','press','Usá una carga controlable y mantené estable la posición.',3,'10–12'),
('plancha','Plancha','Core','Peso corporal','Inicial','plank','Respirá, mantené una postura larga y no fuerces la zona lumbar.',3,'20–30 s'),
('zancadas','Zancadas','Piernas','Peso corporal','Inicial','squat','Dá un paso cómodo y bajá con control; sujetate si perdés equilibrio.',3,'8 por lado'),
('puente-gluteos','Puente de glúteos','Glúteos','Peso corporal','Inicial','hinge','Elevá la cadera sin hiperextender la espalda.',3,'10–15'),
('elevaciones-laterales','Elevaciones laterales','Hombros','Mancuernas','Inicial','press','Brazos suaves, levantá con control y sin impulso.',3,'10–15'),
('jalon-pecho','Jalón al pecho','Espalda','Polea','Intermedio','row','Acercá la barra a la parte alta del pecho, sin tirones.',3,'8–12');