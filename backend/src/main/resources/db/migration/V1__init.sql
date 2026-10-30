create table app_user (
    id uuid primary key,
    email varchar(320) not null unique,
    display_name varchar(120) not null,
    password_hash varchar(100) not null,
    created_at timestamptz not null default now()
);

create table expense_group (
    id uuid primary key,
    name varchar(120) not null,
    currency varchar(3) not null,
    created_by uuid not null references app_user(id),
    created_at timestamptz not null default now()
);

create table group_member (
    group_id uuid not null references expense_group(id) on delete cascade,
    user_id uuid not null references app_user(id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (group_id, user_id)
);

create table expense (
    id uuid primary key,
    group_id uuid not null references expense_group(id) on delete cascade,
    title varchar(200) not null,
    amount_minor bigint not null check (amount_minor > 0),
    expense_date date not null,
    paid_by uuid not null references app_user(id),
    created_by uuid not null references app_user(id),
    request_id varchar(80) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (created_by, request_id)
);

create table expense_share (
    expense_id uuid not null references expense(id) on delete cascade,
    user_id uuid not null references app_user(id),
    share_minor bigint not null check (share_minor >= 0),
    primary key (expense_id, user_id)
);

create table payment (
    id uuid primary key,
    group_id uuid not null references expense_group(id) on delete cascade,
    from_user uuid not null references app_user(id),
    to_user uuid not null references app_user(id),
    amount_minor bigint not null check (amount_minor > 0),
    status varchar(12) not null check (status in ('PENDING','CONFIRMED')),
    recorded_by uuid not null references app_user(id),
    confirmed_by uuid references app_user(id),
    request_id varchar(80) not null,
    created_at timestamptz not null default now(),
    confirmed_at timestamptz,
    unique (recorded_by, request_id)
);

create index idx_expense_group on expense(group_id);
create index idx_payment_group on payment(group_id);
