-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: public.users
-- Automatically linked to auth.users if we use Supabase Auth
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null check (role in ('superadmin', 'admin')),
  school_name text not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: public.academic_years
create table public.academic_years (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default false
);

-- Table: public.categories
create table public.categories (
  id text primary key,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  is_per_student boolean default false
);

-- Table: public.students
create table public.students (
  id text primary key,
  name text not null,
  student_id text not null,
  class text not null,
  parent_name text not null,
  parent_phone text not null,
  registered_at timestamp with time zone not null,
  active boolean default true,
  academic_year_id uuid references public.academic_years(id) on delete cascade
);

-- Table: public.income_transactions
create table public.income_transactions (
  id text primary key,
  student_id text references public.students(id) on delete cascade,
  category text not null,
  amount numeric not null,
  month text not null,
  date date not null,
  description text,
  receipt_number text,
  status text not null check (status in ('completed', 'pending')),
  academic_year_id uuid references public.academic_years(id) on delete cascade
);

-- Table: public.expense_transactions
create table public.expense_transactions (
  id text primary key,
  category text not null,
  amount numeric not null,
  date date not null,
  description text not null,
  month text not null,
  vendor text,
  receipt_file text,
  fund_source text check (fund_source in ('pendapatan', 'bosp')),
  academic_year_id uuid references public.academic_years(id) on delete cascade
);

-- Table: public.budget_allocations
create table public.budget_allocations (
  id uuid primary key default uuid_generate_v4(),
  category text not null,
  monthly_limit numeric not null,
  yearly_limit numeric not null,
  academic_year_id uuid references public.academic_years(id) on delete cascade,
  unique (category, academic_year_id)
);

-- Set up Row Level Security (RLS)
-- For now, let's allow all authenticated users to read/write all data
-- You can restrict this further based on user role or school_name later.
alter table public.users enable row level security;
alter table public.academic_years enable row level security;
alter table public.categories enable row level security;
alter table public.students enable row level security;
alter table public.income_transactions enable row level security;
alter table public.expense_transactions enable row level security;
alter table public.budget_allocations enable row level security;

-- Policies for authenticated users
create policy "Allow all authenticated users full access to users" on public.users for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated users full access to academic_years" on public.academic_years for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated users full access to categories" on public.categories for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated users full access to students" on public.students for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated users full access to income_transactions" on public.income_transactions for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated users full access to expense_transactions" on public.expense_transactions for all using (auth.role() = 'authenticated');
create policy "Allow all authenticated users full access to budget_allocations" on public.budget_allocations for all using (auth.role() = 'authenticated');

-- Function to handle new user registration automatically via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role, school_name, active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', 'Admin'), coalesce(new.raw_user_meta_data->>'role', 'admin'), coalesce(new.raw_user_meta_data->>'school_name', 'Default School'), true);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new auth users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
