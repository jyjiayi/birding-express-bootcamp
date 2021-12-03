CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT,
  password TEXT
);

CREATE TABLE IF NOT EXISTS species (
  id SERIAL PRIMARY KEY,
  name TEXT,
  scientific_name TEXT
);

CREATE TABLE IF NOT EXISTS behaviour (
  id SERIAL PRIMARY KEY,
  action TEXT
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  flock_size INTEGER,
  user_id INTEGER REFERENCES users(id),
  species_id INTEGER REFERENCES species(id),
  date TEXT
);

CREATE TABLE IF NOT EXISTS notes_behaviour (
  id SERIAL PRIMARY KEY,
  notes_id INTEGER REFERENCES notes(id),
  behaviour_id INTEGER REFERENCES behaviour(id)
);
       