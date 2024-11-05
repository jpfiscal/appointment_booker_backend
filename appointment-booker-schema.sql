CREATE TABLE clients (
    client_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts ON DELETE CASCADE,
    gender VARCHAR(50),
    birthday DATE,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100)
);

CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL CHECK (position('@' IN email) > 1),
    phone VARCHAR(14),
    type TEXT NOT NULL
);

CREATE TABLE appointments(
    appointment_id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients ON DELETE CASCADE,
    service_id INTEGER REFERENCES services,
    availability_id INTEGER REFERENCES availabilities,
    client_note TEXT,
    status TEXT NOT NULL
);

CREATE TABLE services(
    service_id SERIAL PRIMARY KEY,
    service_name TEXT NOT NULL,
    service_group TEXT NOT NULL,
    service_desc TEXT NOT NULL,
    service_price NUMERIC(6,2) NOT NULL,
    service_duration INTEGER NOT NULL
);

CREATE TABLE providers(
    provider_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts,
    specialty TEXT,
    provider_desc TEXT
);

CREATE TABLE service_provider(
    service_provider_id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers ON DELETE CASCADE,
    service_id INTEGER REFERENCES services ON DELETE CASCADE
);

CREATE TABLE availabilities(
    availability_id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers ON DELETE CASCADE,
    service_id INTEGER REFERENCES services,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    appointment_id INTEGER REFERENCES appointments NULL
);