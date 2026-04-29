create table if not exists public.user_favorites (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    favorite_user_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz default now()
);

alter table public.user_favorites add constraint user_favorites_unique_favorite unique(user_id, favorite_user_id);
alter table public.user_favorites add constraint user_favorites_check_not_self check(user_id <> favorite_user_id);

alter table public.user_favorites enable row level security;

create policy "Users can view own favorites"
    on public.user_favorites for select
    using (auth.uid() = user_id);

create policy "Users can add favorites"
    on public.user_favorites for insert
    with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
    on public.user_favorites for delete
    using (auth.uid() = user_id);
