CREATE TABLE public.accounts (
    account_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL CHECK (position('@' IN email) > 1),
    phone VARCHAR(14),
    type TEXT NOT NULL
);

CREATE TABLE public.clients (
    client_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts ON DELETE CASCADE,
    gender VARCHAR(50),
    birthday DATE,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100)
);

CREATE TABLE public.providers(
    provider_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts,
    specialty TEXT,
    provider_desc TEXT
);

CREATE TABLE public.user_tokens (
    id SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES accounts,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    access_token_expires TIMESTAMP,
    refresh_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (account_id) -- Add a unique constraint on account_id
);

CREATE TABLE public.services(
    service_id SERIAL PRIMARY KEY,
    service_name TEXT NOT NULL,
    service_group TEXT NOT NULL,
    service_desc TEXT NOT NULL,
    service_price NUMERIC(6,2) NOT NULL,
    service_duration INTEGER NOT NULL
);

CREATE TABLE public.appointments(
    appointment_id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients ON DELETE CASCADE,
    service_id INTEGER REFERENCES services,
    client_note TEXT,
    status TEXT NOT NULL
);

CREATE TABLE public.service_provider(
    service_provider_id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers ON DELETE CASCADE,
    service_id INTEGER REFERENCES services ON DELETE CASCADE
);

CREATE TABLE public.availabilities(
    availability_id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers ON DELETE CASCADE,
    service_id INTEGER REFERENCES services,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    appointment_id INTEGER REFERENCES appointments NULL
);